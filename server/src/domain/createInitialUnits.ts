import { UNIT_COUNT, WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants.js';
import type { InitialSnapshot, Team, Unit } from './battlefield.types.js';
import { computeBattlefieldKpis } from './kpis.js';
import { resolveZone } from './zones.js';

const validateHealth = (health: number): number => {
  if (health < 0 || health > 100) {
    throw new Error(`health out of range: ${health}`);
  }
  return health;
};

const teamForIndex = (index: number): Team => {
  return index < UNIT_COUNT / 2 ? 'red' : 'blue';
};

const createUnit = (index: number): Unit => {
  const x = Math.floor(Math.random() * WORLD_WIDTH);
  const y = Math.floor(Math.random() * WORLD_HEIGHT);
  const team = teamForIndex(index);

  return {
    id: `unit-${index}`,
    name: `${team.toUpperCase()}-${index.toString().padStart(5, '0')}`,
    team,
    x,
    y,
    health: validateHealth(100),
    status: 'idle',
    alive: true,
    zone: resolveZone(x, y, { width: WORLD_WIDTH, height: WORLD_HEIGHT }),
    version: 1
  };
};

export const createInitialUnits = (): Unit[] => {
  const units: Unit[] = [];

  for (let i = 0; i < UNIT_COUNT; i += 1) {
    units.push(createUnit(i));
  }

  return units;
};

export const createInitialSnapshot = (): InitialSnapshot => {
  const units = createInitialUnits();

  return {
    tick: 0,
    units,
    kpis: computeBattlefieldKpis(units, 0)
  };
};
