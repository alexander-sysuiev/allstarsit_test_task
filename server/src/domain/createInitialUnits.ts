import { UNIT_COUNT, WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants.js';
import type { Team, Unit } from '../types/unit.js';

const randomTeam = (): Team => (Math.random() < 0.5 ? 'red' : 'blue');

export const createInitialUnits = (): Unit[] => {
  const units: Unit[] = [];

  for (let i = 0; i < UNIT_COUNT; i += 1) {
    units.push({
      id: `unit-${i}`,
      x: Math.floor(Math.random() * WORLD_WIDTH),
      y: Math.floor(Math.random() * WORLD_HEIGHT),
      hp: 100,
      team: randomTeam(),
      status: 'active'
    });
  }

  return units;
};
