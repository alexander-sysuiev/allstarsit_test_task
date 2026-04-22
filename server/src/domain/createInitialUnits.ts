import { UNIT_COUNT, WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants.js';
import { toPositionKey } from '../utils/positions.js';
import type { InitialSnapshot, Team, Unit } from './domain.types.js';
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

const MAX_POSITION_ATTEMPTS = 1_000;

const createUnit = (index: number, usedPositions: Set<string>): Unit => {
  let x = 0;
  let y = 0;
  let attempts = 0;

  do {
    x = Math.floor(Math.random() * WORLD_WIDTH);
    y = Math.floor(Math.random() * WORLD_HEIGHT);
    attempts += 1;

    if (attempts > MAX_POSITION_ATTEMPTS) {
      throw new Error('failed to allocate a unique starting position');
    }
  } while (usedPositions.has(toPositionKey(x, y)));

  usedPositions.add(toPositionKey(x, y));
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
  const usedPositions = new Set<string>();

  for (let i = 0; i < UNIT_COUNT; i += 1) {
    units.push(createUnit(i, usedPositions));
  }

  return units;
};

export const createInitialSnapshot = (): InitialSnapshot => {
  const units = createInitialUnits();

  return {
    tickNumber: 0,
    units,
    kpis: computeBattlefieldKpis(units)
  };
};
