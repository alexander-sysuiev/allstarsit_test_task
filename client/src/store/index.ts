import { create } from 'zustand';
import { buildUnitPatchUpdates } from '../entities/units/patches';
import type { BattleEvent, BattlefieldKpis, Team, Unit, UnitPatch, Zone } from '../entities/units/types';

const MAX_EVENTS = 200;
const VISIBLE_EVENT_TYPES = new Set(['attack', 'destroy', 'capture', 'heal']);

export type ConnectionPhase = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface FiltersState {
  team: Team | 'all';
  zone: Zone | 'all';
  includeDestroyed: boolean;
}

export interface KpisState {
  tickNumber: number;
  data: BattlefieldKpis | null;
}

export interface ConnectionState {
  phase: ConnectionPhase;
  lastError: string | null;
  lastConnectedAt: number | null;
}

interface UnitsState {
  byId: Record<string, Unit | undefined>;
  allIds: string[];
  lastAppliedTick: number;
}

interface AppActions {
  setSnapshotUnits: (payload: { units: Unit[]; tickNumber: number }) => void;
  applyUnitPatches: (payload: { patches: UnitPatch[]; tickNumber: number }) => void;
  appendEvents: (events: BattleEvent[]) => void;
  clearEvents: () => void;
  setKpisSnapshot: (payload: { tickNumber: number; kpis: BattlefieldKpis }) => void;
  setKpisFromDelta: (payload: { tickNumber: number; kpis: BattlefieldKpis }) => void;
  setConnecting: () => void;
  setReconnecting: () => void;
  setConnected: (payload: { at: number }) => void;
  setConnectionError: (payload: { message: string }) => void;
}

export interface RootState {
  units: UnitsState;
  filters: FiltersState;
  eventsFeed: {
    items: BattleEvent[];
  };
  kpis: KpisState;
  connection: ConnectionState;
  actions: AppActions;
}

const initialFilters: FiltersState = {
  team: 'all',
  zone: 'all',
  includeDestroyed: true
};

const initialConnection: ConnectionState = {
  phase: 'idle',
  lastError: null,
  lastConnectedAt: null
};

const toUnitsState = (units: Unit[], tickNumber: number): UnitsState => {
  const byId: Record<string, Unit | undefined> = {};

  for (const unit of units) {
    byId[unit.id] = unit;
  }

  return {
    byId,
    allIds: units.map((unit) => unit.id),
    lastAppliedTick: tickNumber
  };
};

export const useAppStore = create<RootState>((set, get) => ({
  units: {
    byId: {},
    allIds: [],
    lastAppliedTick: 0
  },
  filters: initialFilters,
  eventsFeed: {
    items: []
  },
  kpis: {
    tickNumber: 0,
    data: null
  },
  connection: initialConnection,
  actions: {
    setSnapshotUnits: ({ units, tickNumber }) => {
      set({
        units: toUnitsState(units, tickNumber)
      });
    },
    applyUnitPatches: ({ patches, tickNumber }) => {
      const currentUnits = get().units;
      const byId = { ...currentUnits.byId };
      const updates = buildUnitPatchUpdates(byId, patches);

      for (const update of updates) {
        const existing = byId[update.id];
        if (!existing) {
          continue;
        }

        byId[update.id] = {
          ...existing,
          ...update.changes
        };
      }

      set({
        units: {
          ...currentUnits,
          byId,
          lastAppliedTick: Math.max(currentUnits.lastAppliedTick, tickNumber)
        }
      });
    },
    appendEvents: (events) => {
      const nextEvents = events.filter((event) => VISIBLE_EVENT_TYPES.has(event.type)).reverse();
      if (nextEvents.length === 0) {
        return;
      }

      set((state) => ({
        eventsFeed: {
          items: [...nextEvents, ...state.eventsFeed.items].slice(0, MAX_EVENTS)
        }
      }));
    },
    clearEvents: () => {
      set({
        eventsFeed: {
          items: []
        }
      });
    },
    setKpisSnapshot: ({ tickNumber, kpis }) => {
      set({
        kpis: {
          tickNumber,
          data: kpis
        }
      });
    },
    setKpisFromDelta: ({ tickNumber, kpis }) => {
      set((state) => ({
        kpis: {
          tickNumber: Math.max(state.kpis.tickNumber, tickNumber),
          data: kpis
        }
      }));
    },
    setConnecting: () => {
      set((state) => ({
        connection: {
          ...state.connection,
          phase: 'connecting',
          lastError: null
        }
      }));
    },
    setReconnecting: () => {
      set((state) => ({
        connection: {
          ...state.connection,
          phase: 'reconnecting'
        }
      }));
    },
    setConnected: ({ at }) => {
      set({
        connection: {
          phase: 'connected',
          lastConnectedAt: at,
          lastError: null
        }
      });
    },
    setConnectionError: ({ message }) => {
      set((state) => ({
        connection: {
          ...state.connection,
          phase: 'error',
          lastError: message
        }
      }));
    }
  }
}));

export const appStore = useAppStore;
