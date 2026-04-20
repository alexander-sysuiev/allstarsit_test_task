import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type { Unit, UnitPatch } from './types';

const unitsAdapter = createEntityAdapter<Unit>();

interface UnitsMetaState {
  lastAppliedTick: number;
}

const initialState = unitsAdapter.getInitialState<UnitsMetaState>({
  lastAppliedTick: 0
});

const unitsSlice = createSlice({
  name: 'units',
  initialState,
  reducers: {
    setSnapshotUnits: (state, action: PayloadAction<{ units: Unit[]; tickNumber: number }>) => {
      unitsAdapter.setAll(state, action.payload.units);
      state.lastAppliedTick = action.payload.tickNumber;
    },
    applyUnitPatches: (state, action: PayloadAction<{ patches: UnitPatch[]; tickNumber: number }>) => {
      // Apply only incoming field-level changes to existing entities.
      // This avoids rebuilding full 20k unit objects on each tick.
      const updates = action.payload.patches
        .filter((patch) => state.entities[patch.id] !== undefined)
        .map((patch) => ({
          id: patch.id,
          changes: {
            ...patch.changes,
            version: patch.version
          } as Partial<Unit>
        }));

      unitsAdapter.updateMany(state, updates);
      state.lastAppliedTick = Math.max(state.lastAppliedTick, action.payload.tickNumber);
    }
  }
});

export const { setSnapshotUnits, applyUnitPatches } = unitsSlice.actions;
export const unitsReducer = unitsSlice.reducer;

export const unitsSelectors = unitsAdapter.getSelectors<RootState>((state) => state.units);
export const selectLastAppliedTick = (state: RootState): number => state.units.lastAppliedTick;
