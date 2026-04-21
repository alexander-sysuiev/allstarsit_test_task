import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialUnits } from './createInitialUnits.js';

test('createInitialUnits allocates unique coordinates', () => {
  const units = createInitialUnits();
  const positions = new Set(units.map((unit) => `${unit.x}:${unit.y}`));

  assert.equal(positions.size, units.length);
});
