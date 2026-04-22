import type { AttackActionResult, SimpleActionResult } from '../domain/domain.types.js';

export interface IdleAttackResolution {
  kind: 'idle';
  result: SimpleActionResult;
}

export interface SuccessfulAttackResolution {
  kind: 'attack';
  result: AttackActionResult;
  targetId: string;
}

export type AttackResolution = IdleAttackResolution | SuccessfulAttackResolution;
