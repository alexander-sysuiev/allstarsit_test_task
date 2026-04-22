import type { SimpleActionResult, Unit } from '../domain/domain.types.js';
import { randomIdle } from '../domain/actions.js';

export const resolveIdleAction = (unit: Unit): SimpleActionResult => {
  return randomIdle(unit);
};
