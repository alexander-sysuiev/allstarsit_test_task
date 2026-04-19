import type { BattleEvent, MapBounds, Unit, UnitPatch, UnitStatus } from './battlefield.types.js';
import { clampToBounds, resolveZone } from './zones.js';

const MAX_STEP = 20;
const MAX_ATTACK_DAMAGE = 12;
const MAX_HEAL = 8;

export interface SingleActionResult {
  patch: UnitPatch;
  event: BattleEvent;
}

export interface AttackActionResult {
  patches: UnitPatch[];
  events: BattleEvent[];
}

const createEvent = (params: {
  id: string;
  tick: number;
  type: BattleEvent['type'];
  unit: Unit;
  details: string;
}): BattleEvent => {
  return {
    id: params.id,
    tick: params.tick,
    at: Date.now(),
    type: params.type,
    unitId: params.unit.id,
    team: params.unit.team,
    zone: params.unit.zone,
    details: params.details
  };
};

const nextVersion = (unit: Unit): number => unit.version + 1;

const withStatus = (status: UnitStatus): Pick<Unit, 'status' | 'alive'> => ({
  status,
  alive: status !== 'dead'
});

export const randomMovement = (unit: Unit, tick: number, bounds: MapBounds): SingleActionResult => {
  const nextX = clampToBounds(unit.x + randomStep(MAX_STEP), 0, bounds.width);
  const nextY = clampToBounds(unit.y + randomStep(MAX_STEP), 0, bounds.height);
  const nextZone = resolveZone(nextX, nextY, bounds);

  const patch: UnitPatch = {
    id: unit.id,
    version: nextVersion(unit),
    changes: {
      ...withStatus('moving'),
      x: nextX,
      y: nextY,
      zone: nextZone
    }
  };

  const zoneSuffix = nextZone !== unit.zone ? ` and entered ${nextZone}` : '';
  const event = createEvent({
    id: `evt-${tick}-${unit.id}-move`,
    tick,
    type: nextZone !== unit.zone ? 'zone-change' : 'move',
    unit,
    details: `Unit moved to (${nextX}, ${nextY})${zoneSuffix}.`
  });

  return { patch, event };
};

export const randomAttack = (attacker: Unit, target: Unit, tick: number): AttackActionResult => {
  const damage = 1 + Math.floor(Math.random() * MAX_ATTACK_DAMAGE);
  const nextHealth = Math.max(0, target.health - damage);
  const targetDead = nextHealth === 0;

  const attackerPatch: UnitPatch = {
    id: attacker.id,
    version: nextVersion(attacker),
    changes: withStatus('attacking')
  };

  const targetPatch: UnitPatch = {
    id: target.id,
    version: target.version + 1,
    changes: {
      health: nextHealth,
      ...(targetDead ? withStatus('dead') : withStatus('attacking'))
    }
  };

  const attackEvent = createEvent({
    id: `evt-${tick}-${attacker.id}-atk-${target.id}`,
    tick,
    type: 'attack',
    unit: attacker,
    details: `Unit attacked ${target.id} for ${damage} damage.`
  });

  const events: BattleEvent[] = [attackEvent];

  if (targetDead) {
    events.push(
      createEvent({
        id: `evt-${tick}-${target.id}-death`,
        tick,
        type: 'death',
        unit: target,
        details: `Unit was destroyed by ${attacker.id}.`
      })
    );
  }

  return {
    patches: [attackerPatch, targetPatch],
    events
  };
};

export const randomHealing = (unit: Unit, tick: number): SingleActionResult => {
  const heal = 1 + Math.floor(Math.random() * MAX_HEAL);
  const nextHealth = Math.min(100, unit.health + heal);

  const patch: UnitPatch = {
    id: unit.id,
    version: nextVersion(unit),
    changes: {
      ...withStatus('healing'),
      health: nextHealth
    }
  };

  const event = createEvent({
    id: `evt-${tick}-${unit.id}-heal`,
    tick,
    type: 'heal',
    unit,
    details: `Unit recovered ${nextHealth - unit.health} health.`
  });

  return { patch, event };
};

export const randomIdle = (unit: Unit, tick: number): SingleActionResult => {
  const patch: UnitPatch = {
    id: unit.id,
    version: nextVersion(unit),
    changes: withStatus('idle')
  };

  const event = createEvent({
    id: `evt-${tick}-${unit.id}-idle`,
    tick,
    type: 'idle',
    unit,
    details: 'Unit stayed in position.'
  });

  return { patch, event };
};

const randomStep = (magnitude: number): number => {
  return Math.floor((Math.random() * 2 - 1) * magnitude);
};
