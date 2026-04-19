import type { BattlefieldKpis, Unit } from './battlefield.types.js';
import { calculateZoneControl } from './zones.js';

export const computeBattlefieldKpis = (units: Unit[]): BattlefieldKpis => {
  let unitsAlive = 0;

  for (const unit of units) {
    if (unit.alive) {
      unitsAlive += 1;
    }
  }

  return {
    unitsAlive,
    destroyedCount: units.length - unitsAlive,
    zoneControl: calculateZoneControl(units)
  };
};
