import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants.js';
import { randomMovement, type SimpleActionResult } from '../domain/actions.js';
import type { Unit } from '../domain/battlefield.types.js';
import { resolveIdleAction } from './idleActionService.js';
import { toPositionKey } from '../domain/positions.js';


export const resolveMoveAction = (
  actor: Unit,
  unitIdByPosition: Map<string, string>
): SimpleActionResult => {
  const proposedResult = randomMovement(actor, { width: WORLD_WIDTH, height: WORLD_HEIGHT });
  const nextX = proposedResult.changes.x ?? actor.x;
  const nextY = proposedResult.changes.y ?? actor.y;

  const occupantId = unitIdByPosition.get(toPositionKey(nextX, nextY));

  if (occupantId !== undefined && occupantId !== actor.id) {
    return resolveIdleAction(actor);
  }

  return proposedResult;
};
