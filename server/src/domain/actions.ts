import type { BattleEvent, MapBounds, Unit } from './battlefield.types.js';
import { clampToBounds, resolveZone } from './zones.js';

const MAX_STEP = 20;
const MAX_ATTACK_DAMAGE = 12;
const MAX_HEAL = 8;

type UnitChangeSet = Partial<Pick<Unit, 'x' | 'y' | 'health' | 'status' | 'alive' | 'zone'>>;

export interface SimpleActionResult {
  changes: UnitChangeSet;
  event: Omit<BattleEvent, 'tickNumber' | 'serverTime'>;
}

export interface AttackActionResult {
  attackerChanges: UnitChangeSet;
  targetChanges: UnitChangeSet;
  events: Array<Omit<BattleEvent, 'tickNumber' | 'serverTime'>>;
}

export const randomMovement = (unit: Unit, bounds: MapBounds): SimpleActionResult => {
  const x = clampToBounds(unit.x + randomStep(MAX_STEP), 0, bounds.width);
  const y = clampToBounds(unit.y + randomStep(MAX_STEP), 0, bounds.height);
  const zone = resolveZone(x, y, bounds);

  return {
    changes: {
      x,
      y,
      zone,
      status: 'moving'
    },
    event: {
      id: `${unit.id}-move`,
      type: 'move',
      zone,
      unitId: unit.id,
      team: unit.team,
      details: `Unit moved to (${x}, ${y}).`
    }
  };
};

export const randomHealing = (unit: Unit): SimpleActionResult => {
  const healAmount = 1 + Math.floor(Math.random() * MAX_HEAL);
  const health = Math.min(100, unit.health + healAmount);

  return {
    changes: {
      health,
      status: 'healing'
    },
    event: {
      id: `${unit.id}-heal`,
      type: 'heal',
      zone: unit.zone,
      unitId: unit.id,
      team: unit.team,
      details: `Unit recovered ${health - unit.health} health.`
    }
  };
};

export const randomIdle = (unit: Unit): SimpleActionResult => {
  return {
    changes: {
      status: 'idle'
    },
    event: {
      id: `${unit.id}-idle`,
      type: 'idle',
      zone: unit.zone,
      unitId: unit.id,
      team: unit.team,
      details: 'Unit remained idle.'
    }
  };
};

export const randomAttack = (attacker: Unit, target: Unit): AttackActionResult => {
  const damage = 1 + Math.floor(Math.random() * MAX_ATTACK_DAMAGE);
  const health = Math.max(0, target.health - damage);
  const destroyed = health === 0;

  const attackEvent: Omit<BattleEvent, 'tickNumber' | 'serverTime'> = {
    id: `${attacker.id}-attack-${target.id}`,
    type: 'attack',
    zone: attacker.zone,
    unitId: attacker.id,
    targetId: target.id,
    team: attacker.team,
    details: `Unit attacked ${target.id} for ${damage} damage.`
  };

  const events: Array<Omit<BattleEvent, 'tickNumber' | 'serverTime'>> = [attackEvent];

  if (destroyed) {
    events.push({
      id: `${target.id}-destroy`,
      type: 'destroy',
      zone: target.zone,
      unitId: target.id,
      targetId: attacker.id,
      team: target.team,
      details: `Unit was destroyed by ${attacker.id}.`
    });
  }

  return {
    attackerChanges: {
      status: 'attacking'
    },
    targetChanges: {
      health,
      status: destroyed ? 'dead' : 'attacking',
      alive: !destroyed
    },
    events
  };
};

const randomStep = (magnitude: number): number => {
  return Math.floor((Math.random() * 2 - 1) * magnitude);
};
