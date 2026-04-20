import assert from 'node:assert/strict';
import test from 'node:test';
import { buildUnitPatchUpdates } from './patches';
import type { Unit, UnitPatch } from './types';

const baseUnit: Unit = {
  id: 'unit-1',
  name: 'RED-00001',
  team: 'red',
  x: 100,
  y: 200,
  health: 100,
  status: 'idle',
  alive: true,
  zone: 'north-west',
  version: 1
};

test('buildUnitPatchUpdates applies changes only for known units', () => {
  const patches: UnitPatch[] = [
    {
      id: 'unit-1',
      version: 2,
      changes: {
        x: 120,
        y: 210,
        status: 'moving'
      }
    },
    {
      id: 'missing-unit',
      version: 3,
      changes: {
        health: 0,
        alive: false,
        status: 'dead'
      }
    }
  ];

  const updates = buildUnitPatchUpdates({ 'unit-1': baseUnit }, patches);

  assert.deepEqual(updates, [
    {
      id: 'unit-1',
      changes: {
        x: 120,
        y: 210,
        status: 'moving',
        version: 2
      }
    }
  ]);
});
