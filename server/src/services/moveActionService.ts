import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants.js';
import type { SimpleActionResult, Unit } from '../domain/domain.types.js';
import { toPositionKey } from '../utils/positions.js';
import { randomMovement } from '../domain/actions.js';
import { resolveIdleAction } from './idleActionService.js';

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
