import { MAX_STEP } from '../config/constants.js';
import type { AttackResolution } from './attackAction.types.js';
import { randomAttack, randomIdle } from '../domain/actions.js';
import type { Unit } from '../domain/domain.types.js';

export const resolveAttackAction = (attacker: Unit, candidates: Unit[]): AttackResolution => {
  const target = pickClosestEnemyTarget(attacker, candidates);
  if (!target) {
    return {
      kind: 'idle',
      result: randomIdle(attacker)
    };
  }

  return {
    kind: 'attack',
    result: randomAttack(attacker, target),
    targetId: target.id
  };
};

const pickClosestEnemyTarget = (attacker: Unit, candidates: Unit[]): Unit | undefined => {
  let closestTarget: Unit | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    if (candidate.id === attacker.id || !candidate.alive || candidate.team === attacker.team) {
      continue;
    }

    const distance = getMovementDistance(attacker, candidate);
    if (distance > MAX_STEP) {
      continue;
    }

    if (distance < closestDistance) {
      closestTarget = candidate;
      closestDistance = distance;
    }
  }

  return closestTarget;
};

const getMovementDistance = (from: Unit, to: Unit): number => {
  const deltaX = from.x - to.x;
  const deltaY = from.y - to.y;
  return Math.hypot(deltaX, deltaY);
};
