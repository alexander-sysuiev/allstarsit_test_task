import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateZoneControl } from './zones.js';
import type { Unit } from './battlefield.types.js';

const createUnit = (overrides: Partial<Unit>): Unit => ({
  id: overrides.id ?? 'unit-1',
  name: overrides.name ?? 'Unit',
  team: overrides.team ?? 'red',
  x: overrides.x ?? 0,
  y: overrides.y ?? 0,
  health: overrides.health ?? 100,
  status: overrides.status ?? 'idle',
  alive: overrides.alive ?? true,
  zone: overrides.zone ?? 'north-west',
  version: overrides.version ?? 1
});

test('calculateZoneControl returns leading team per zone and ignores destroyed units', () => {
  const units: Unit[] = [
    createUnit({ id: 'nw-red-1', zone: 'north-west', team: 'red' }),
    createUnit({ id: 'nw-red-2', zone: 'north-west', team: 'red' }),
    createUnit({ id: 'nw-blue', zone: 'north-west', team: 'blue' }),
    createUnit({ id: 'ne-blue', zone: 'north-east', team: 'blue' }),
    createUnit({ id: 'sw-red-dead', zone: 'south-west', team: 'red', alive: false, health: 0, status: 'dead' }),
    createUnit({ id: 'sw-blue-dead', zone: 'south-west', team: 'blue', alive: false, health: 0, status: 'dead' }),
    createUnit({ id: 'se-red', zone: 'south-east', team: 'red' }),
    createUnit({ id: 'se-blue', zone: 'south-east', team: 'blue' })
  ];

  assert.deepEqual(calculateZoneControl(units), {
    'north-west': 'red',
    'north-east': 'blue',
    'south-west': 'neutral',
    'south-east': 'contested'
  });
});
