import {
  MAX_CHANGED_UNITS_PER_TICK,
  MIN_CHANGED_UNITS_PER_TICK,
} from '../config/constants.js';
import { randomHealing, type SimpleActionResult } from '../domain/actions.js';
import { computeBattlefieldKpis } from '../domain/kpis.js';
import { toPositionKey } from '../domain/positions.js';
import type {
  BattlefieldKpis,
  BattleEvent,
  TickDelta,
  Unit,
  UnitPatch,
  Zone,
  ZoneControl
} from '../domain/battlefield.types.js';
import { resolveAttackAction } from './attackActionService.js';
import { resolveIdleAction } from './idleActionService.js';
import { resolveMoveAction } from './moveActionService.js';

const ACTIVE_UNIT_STATUSES = new Set<Unit['status']>(['idle', 'moving', 'attacking', 'healing']);

export class UnitSimulationService {
  private readonly unitsById = new Map<string, Unit>();
  private readonly unitIds: string[];
  private readonly unitIdByPosition = new Map<string, string>();
  private tickNumber = 0;
  private currentKpis: BattlefieldKpis;
  private previousZoneControl: Record<Zone, ZoneControl>;

  constructor(initialUnits: Unit[]) {
    for (const unit of initialUnits) {
      const positionKey = toPositionKey(unit.x, unit.y);
      if (this.unitIdByPosition.has(positionKey)) {
        throw new Error(`duplicate unit position detected at ${positionKey}`);
      }

      this.unitsById.set(unit.id, unit);
      this.unitIdByPosition.set(positionKey, unit.id);
    }
    this.unitIds = initialUnits.map((unit) => unit.id);
    this.currentKpis = computeBattlefieldKpis(initialUnits);
    this.previousZoneControl = this.currentKpis.zoneControl;
  }

  getSnapshot(): Unit[] {
    return this.unitIds
      .map((id) => this.unitsById.get(id))
      .filter((unit): unit is Unit => unit !== undefined);
  }

  getTickNumber(): number {
    return this.tickNumber;
  }

  getKpis(): BattlefieldKpis {
    return this.currentKpis;
  }

  tick(): TickDelta {
    this.tickNumber += 1;

    const serverTime = Date.now();
    const events: BattleEvent[] = [];
    const changedUnitsById = new Map<string, UnitPatch>();

    const actorIds = this.pickUniqueAliveUnits(this.randomChangedCount());

    for (const actorId of actorIds) {
      const actor = this.unitsById.get(actorId);
      if (!actor || !actor.alive) {
        continue;
      }

      const roll = Math.random();

      if (roll < 0.45) {
        const resolution = resolveMoveAction(actor, this.unitIdByPosition);
        this.applySimpleAction(actor.id, resolution, changedUnitsById, events, serverTime);
        continue;
      }

      if (roll < 0.72) {
        const candidates = this.getTargetCandidates(actorIds);
        const resolution = resolveAttackAction(actor, candidates);

        if (resolution.kind === 'idle') {
          this.applySimpleAction(actor.id, resolution.result, changedUnitsById, events, serverTime);
          continue;
        }

        this.applyUnitChanges(actor.id, resolution.result.attackerChanges, changedUnitsById);
        this.applyUnitChanges(resolution.targetId, resolution.result.targetChanges, changedUnitsById);
        for (const event of resolution.result.events) {
          events.push(this.withTickContext(event, serverTime));
        }
        continue;
      }

      if (roll < 0.9 && actor.health < 100) {
        const resolution = randomHealing(actor);
        this.applySimpleAction(actor.id, resolution, changedUnitsById, events, serverTime);
        continue;
      }

      const resolution = resolveIdleAction(actor);
      this.applySimpleAction(actor.id, resolution, changedUnitsById, events, serverTime);
    }

    const units = this.getSnapshot();
    const kpis = computeBattlefieldKpis(units);

    events.push(...this.buildCaptureEvents(kpis.zoneControl, serverTime));
    this.previousZoneControl = kpis.zoneControl;
    this.currentKpis = kpis;

    return {
      tickNumber: this.tickNumber,
      serverTime,
      changedUnits: Array.from(changedUnitsById.values()),
      events,
      kpis
    };
  }

  private randomChangedCount(): number {
    const range = MAX_CHANGED_UNITS_PER_TICK - MIN_CHANGED_UNITS_PER_TICK + 1;
    return MIN_CHANGED_UNITS_PER_TICK + Math.floor(Math.random() * range);
  }

  private pickUniqueAliveUnits(targetCount: number): string[] {
    const selectedIds = new Set<string>();
    const maxAttempts = targetCount * 10;
    let attempts = 0;

    while (selectedIds.size < targetCount && attempts < maxAttempts) {
      attempts += 1;
      const id = this.unitIds[Math.floor(Math.random() * this.unitIds.length)];
      if (!id || selectedIds.has(id)) {
        continue;
      }

      const unit = this.unitsById.get(id);
      if (!unit || !unit.alive) {
        continue;
      }

      selectedIds.add(id);
    }

    return Array.from(selectedIds);
  }

  private getTargetCandidates(actorIds: string[]): Unit[] {
    return actorIds
      .map((candidateId) => this.unitsById.get(candidateId))
      .filter((candidate): candidate is Unit => candidate !== undefined);
  }

  private applySimpleAction(
    unitId: string,
    action: SimpleActionResult,
    changedUnitsById: Map<string, UnitPatch>,
    events: BattleEvent[],
    serverTime: number
  ): void {
    this.applyUnitChanges(unitId, action.changes, changedUnitsById);
    events.push(this.withTickContext(action.event, serverTime));
  }

  private applyUnitChanges(
    unitId: string,
    proposedChanges: Partial<Pick<Unit, 'x' | 'y' | 'health' | 'status' | 'alive' | 'zone'>>,
    changedUnitsById: Map<string, UnitPatch>
  ): void {
    const current = this.unitsById.get(unitId);
    if (!current) {
      return;
    }

    if (!current.alive) {
      if (
        proposedChanges.status !== undefined &&
        ACTIVE_UNIT_STATUSES.has(proposedChanges.status) &&
        proposedChanges.alive !== true
      ) {
        return;
      }
    }

    const candidateHealth = proposedChanges.health ?? current.health;
    const normalizedHealth = Math.min(100, Math.max(0, candidateHealth));
    const normalizedAlive = proposedChanges.alive ?? normalizedHealth > 0;
    const normalizedStatus =
      normalizedAlive === false ? 'dead' : (proposedChanges.status ?? current.status);

    const next: Unit = {
      ...current,
      ...proposedChanges,
      health: normalizedHealth,
      alive: normalizedAlive,
      status: normalizedStatus,
      version: current.version + 1
    };

    const changes: UnitPatch['changes'] = {};

    if (next.x !== current.x) {
      changes.x = next.x;
    }
    if (next.y !== current.y) {
      changes.y = next.y;
    }
    if (next.health !== current.health) {
      changes.health = next.health;
    }
    if (next.status !== current.status) {
      changes.status = next.status;
    }
    if (next.alive !== current.alive) {
      changes.alive = next.alive;
    }
    if (next.zone !== current.zone) {
      changes.zone = next.zone;
    }

    if (Object.keys(changes).length === 0) {
      return;
    }

    if (changes.x !== undefined || changes.y !== undefined) {
      this.unitIdByPosition.delete(toPositionKey(current.x, current.y));
      this.unitIdByPosition.set(toPositionKey(next.x, next.y), unitId);
    }

    this.unitsById.set(unitId, next);

    const existing = changedUnitsById.get(unitId);
    if (!existing) {
      changedUnitsById.set(unitId, {
        id: unitId,
        version: next.version,
        changes
      });
      return;
    }

    changedUnitsById.set(unitId, {
      id: unitId,
      version: next.version,
      changes: {
        ...existing.changes,
        ...changes
      }
    });
  }

  private withTickContext(event: Omit<BattleEvent, 'tickNumber' | 'serverTime'>, serverTime: number): BattleEvent {
    return {
      ...event,
      id: `${event.id}-t${this.tickNumber}`,
      tickNumber: this.tickNumber,
      serverTime
    };
  }

  private buildCaptureEvents(nextZoneControl: Record<Zone, ZoneControl>, serverTime: number): BattleEvent[] {
    const captureEvents: BattleEvent[] = [];

    for (const zone of Object.keys(nextZoneControl) as Zone[]) {
      const previous = this.previousZoneControl[zone];
      const current = nextZoneControl[zone];

      if ((current === 'red' || current === 'blue') && previous !== current) {
        captureEvents.push({
          id: `capture-${zone}-t${this.tickNumber}`,
          tickNumber: this.tickNumber,
          serverTime,
          type: 'capture',
          zone,
          team: current,
          details: `${current.toUpperCase()} captured ${zone}.`
        });
      }
    }

    return captureEvents;
  }
}
