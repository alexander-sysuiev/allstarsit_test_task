import { randomIdle, type SimpleActionResult } from '../domain/actions.js';
import type { Unit } from '../domain/battlefield.types.js';

export const resolveIdleAction = (unit: Unit): SimpleActionResult => {
  return randomIdle(unit);
};
