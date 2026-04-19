import { CHANGED_UNITS_PER_TICK, WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants.js';
import type { Unit, UnitDelta } from '../types/unit.js';

export class UnitSimulationService {
  private readonly unitsById = new Map<string, Unit>();
  private readonly unitIds: string[];

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

  tick(): UnitDelta[] {
    const deltas: UnitDelta[] = [];

    for (let i = 0; i < CHANGED_UNITS_PER_TICK; i += 1) {
      const id = this.unitIds[Math.floor(Math.random() * this.unitIds.length)];
      const unit = id !== undefined ? this.unitsById.get(id) : undefined;

      if (!unit || unit.status === 'destroyed') {
        continue;
      }

      const nextX = Math.max(0, Math.min(WORLD_WIDTH, unit.x + randomStep(15)));
      const nextY = Math.max(0, Math.min(WORLD_HEIGHT, unit.y + randomStep(15)));

      const damageRoll = Math.random();
      const hpLoss = damageRoll > 0.93 ? Math.floor(Math.random() * 10) : 0;
      const nextHp = Math.max(0, unit.hp - hpLoss);
      const nextStatus = nextHp === 0 ? 'destroyed' : 'active';

      unit.x = nextX;
      unit.y = nextY;
      unit.hp = nextHp;
      unit.status = nextStatus;

      deltas.push({
        id: unit.id,
        x: unit.x,
        y: unit.y,
        hp: unit.hp,
        status: unit.status
      });
    }

    return deltas;
  }
}

const randomStep = (magnitude: number): number => {
  return Math.floor((Math.random() * 2 - 1) * magnitude);
};
