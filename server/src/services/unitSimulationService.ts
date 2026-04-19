import { CHANGED_UNITS_PER_TICK, WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants.js';
import {
  randomAttack,
  randomHealing,
  randomIdle,
  randomMovement,
  type AttackActionResult,
  type SingleActionResult
} from '../domain/actions.js';
import { computeBattlefieldKpis } from '../domain/kpis.js';
import type { TickDelta, Unit, UnitPatch } from '../domain/battlefield.types.js';

export class UnitSimulationService {
  private readonly unitsById = new Map<string, Unit>();
  private readonly unitIds: string[];
  private tickCount = 0;

  constructor(initialUnits: Unit[]) {
    for (const unit of initialUnits) {
      this.unitsById.set(unit.id, unit);
    }
    this.unitIds = initialUnits.map((unit) => unit.id);
  }

  getSnapshot(): Unit[] {
    return this.unitIds
      .map((id) => this.unitsById.get(id))
      .filter((unit): unit is Unit => unit !== undefined);
  }

  tick(): TickDelta {
    this.tickCount += 1;

    const patches: UnitPatch[] = [];
    const events: TickDelta['events'] = [];

    for (let i = 0; i < CHANGED_UNITS_PER_TICK; i += 1) {
      const primary = this.pickRandomUnit();
      if (!primary || !primary.alive) {
        continue;
      }

      const roll = Math.random();
      if (roll < 0.45) {
        const result = randomMovement(primary, this.tickCount, { width: WORLD_WIDTH, height: WORLD_HEIGHT });
        this.applySingle(result, patches, events);
        continue;
      }

      if (roll < 0.7) {
        const target = this.pickOpponent(primary.team);
        if (!target) {
          continue;
        }
        const result = randomAttack(primary, target, this.tickCount);
        this.applyAttack(result, patches, events);
        continue;
      }

      if (roll < 0.9 && primary.health < 100) {
        const result = randomHealing(primary, this.tickCount);
        this.applySingle(result, patches, events);
        continue;
      }

      const result = randomIdle(primary, this.tickCount);
      this.applySingle(result, patches, events);
    }

    const kpis = computeBattlefieldKpis(this.getSnapshot(), this.tickCount);

    return {
      tick: this.tickCount,
      at: Date.now(),
      patches,
      events,
      kpis
    };
  }

  private pickRandomUnit(): Unit | undefined {
    const id = this.unitIds[Math.floor(Math.random() * this.unitIds.length)];
    return id !== undefined ? this.unitsById.get(id) : undefined;
  }

  private pickOpponent(team: Unit['team']): Unit | undefined {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = this.pickRandomUnit();
      if (candidate && candidate.alive && candidate.team !== team) {
        return candidate;
      }
    }
    return undefined;
  }

  private applySingle(result: SingleActionResult, patches: UnitPatch[], events: TickDelta['events']): void {
    this.applyPatch(result.patch, patches);
    events.push(result.event);
  }

  private applyAttack(result: AttackActionResult, patches: UnitPatch[], events: TickDelta['events']): void {
    for (const patch of result.patches) {
      this.applyPatch(patch, patches);
    }
    events.push(...result.events);
  }

  private applyPatch(patch: UnitPatch, patches: UnitPatch[]): void {
    const unit = this.unitsById.get(patch.id);
    if (!unit) {
      return;
    }

    const nextHealth =
      patch.changes.health !== undefined ? Math.max(0, Math.min(100, patch.changes.health)) : unit.health;

    const nextUnit: Unit = {
      ...unit,
      ...patch.changes,
      health: nextHealth,
      alive: patch.changes.alive ?? nextHealth > 0,
      version: patch.version
    };

    this.unitsById.set(nextUnit.id, nextUnit);
    patches.push(patch);
  }
}
