import {
  MAX_CHANGED_UNITS_PER_TICK,
  MAX_STEP,
  MIN_CHANGED_UNITS_PER_TICK,
  WORLD_HEIGHT,
  WORLD_WIDTH
} from '../config/constants.js';
import { randomAttack, randomHealing, randomIdle, randomMovement, type SimpleActionResult } from '../domain/actions.js';
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
        const proposedResult = randomMovement(actor, { width: WORLD_WIDTH, height: WORLD_HEIGHT });
        const nextX = proposedResult.changes.x ?? actor.x;
        const nextY = proposedResult.changes.y ?? actor.y;
        const result = this.isPositionOccupiedByAnotherUnit(actor.id, nextX, nextY)
          ? randomIdle(actor)
          : proposedResult;

        this.applySimpleAction(actor.id, result, changedUnitsById, events, serverTime);
        continue;
      }

      if (roll < 0.72) {
        const target = this.pickEnemyTarget(actor, actorIds);
        if (!target) {
          const result = randomIdle(actor);
          this.applySimpleAction(actor.id, result, changedUnitsById, events, serverTime);
          continue;
        }

        const attackResult = randomAttack(actor, target);

        this.applyUnitChanges(actor.id, attackResult.attackerChanges, changedUnitsById);
        this.applyUnitChanges(target.id, attackResult.targetChanges, changedUnitsById);

        for (const event of attackResult.events) {
          events.push(this.withTickContext(event, serverTime));
        }
        continue;
      }

      if (roll < 0.9 && actor.health < 100) {
        const result = randomHealing(actor);
        this.applySimpleAction(actor.id, result, changedUnitsById, events, serverTime);
        continue;
      }

      const result = randomIdle(actor);
      this.applySimpleAction(actor.id, result, changedUnitsById, events, serverTime);
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

  private pickEnemyTarget(attacker: Unit, actorIds: string[]): Unit | undefined {
    let closestTarget: Unit | undefined;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const actorId of actorIds) {
      if (!actorId || actorId === attacker.id) {
        continue;
      }

      const candidate = this.unitsById.get(actorId);
      if (!candidate || !candidate.alive || candidate.team === attacker.team) {
        continue;
      }

      const distance = this.getMovementDistance(attacker, candidate);
      if (distance > MAX_STEP) {
        continue;
      }

      if (distance < closestDistance) {
        closestTarget = candidate;
        closestDistance = distance;
      }
    }

    return closestTarget;
  }

  private getMovementDistance(from: Unit, to: Unit): number {
    const deltaX = from.x - to.x;
    const deltaY = from.y - to.y;
    return Math.hypot(deltaX, deltaY);
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

  private isPositionOccupiedByAnotherUnit(unitId: string, x: number, y: number): boolean {
    const occupantId = this.unitIdByPosition.get(toPositionKey(x, y));
    return occupantId !== undefined && occupantId !== unitId;
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
