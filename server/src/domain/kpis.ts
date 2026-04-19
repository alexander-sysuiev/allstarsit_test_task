import type { BattlefieldKpis, TeamKpis, Unit } from './battlefield.types.js';
import { calculateZoneControl } from './zones.js';

const computeTeamKpis = (units: Unit[]): TeamKpis => {
  const total = units.length;
  const alive = units.filter((unit) => unit.alive).length;
  const totalHealth = units.reduce((acc, unit) => acc + unit.health, 0);

  return {
    total,
    alive,
    avgHealth: total === 0 ? 0 : Number((totalHealth / total).toFixed(2))
  };
};

export const computeBattlefieldKpis = (units: Unit[], tick: number): BattlefieldKpis => {
  const aliveUnits = units.filter((unit) => unit.alive).length;
  const deadUnits = units.length - aliveUnits;

  const redUnits = units.filter((unit) => unit.team === 'red');
  const blueUnits = units.filter((unit) => unit.team === 'blue');

  return {
    tick,
    totalUnits: units.length,
    aliveUnits,
    deadUnits,
    red: computeTeamKpis(redUnits),
    blue: computeTeamKpis(blueUnits),
    zoneControl: calculateZoneControl(units)
  };
};
