import assert from 'node:assert/strict';
import test from 'node:test';
import type { Unit } from '../../src/domain/battlefield.types.js';
import { UnitSimulationService } from '../../src/services/unitSimulationService.js';

const createUnit = (index: number): Unit => ({
  id: `unit-${index}`,
  name: `Unit-${index}`,
  team: index % 2 === 0 ? 'red' : 'blue',
  x: index * 5,
  y: index * 5,
  health: 100,
  status: 'idle',
  alive: true,
  zone: index % 4 < 2 ? 'north-west' : 'south-east',
  version: 1
});

const withSeededRandom = (seed: number, run: () => void): void => {
  const originalRandom = Math.random;
  let currentSeed = seed;

  Math.random = () => {
    currentSeed = (currentSeed * 48271) % 0x7fffffff;
    return currentSeed / 0x7fffffff;
  };

  try {
    run();
  } finally {
    Math.random = originalRandom;
  }
};

test('tick advances simulation state and returns a consistent delta payload', () => {
  const units = Array.from({ length: 300 }, (_, index) => createUnit(index));
  const simulation = new UnitSimulationService(units);

  withSeededRandom(12345, () => {
    const delta = simulation.tick();

    assert.equal(delta.tickNumber, 1);
    assert.ok(delta.serverTime > 0);
    assert.ok(delta.changedUnits.length > 0);
    assert.equal(simulation.getTickNumber(), 1);

    for (const patch of delta.changedUnits) {
      assert.ok(patch.version >= 2);
      assert.ok(Object.keys(patch.changes).length > 0);
    }

    for (const event of delta.events) {
      assert.equal(event.tickNumber, 1);
      assert.equal(event.serverTime, delta.serverTime);
    }

    assert.equal(
      delta.kpis.unitsAlive + delta.kpis.destroyedCount,
      simulation.getSnapshot().length
    );
  });
});

test('constructor rejects overlapping starting positions', () => {
  const units: Unit[] = [
    createUnit(0),
    {
      ...createUnit(1),
      x: 0,
      y: 0
    }
  ];

  assert.throws(() => new UnitSimulationService(units), /duplicate unit position/);
});
