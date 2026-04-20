import type { Update } from '@reduxjs/toolkit';
import type { Unit, UnitPatch } from './types';

type UnitEntityMap = Record<string, Unit | undefined>;

export const buildUnitPatchUpdates = (
  entities: UnitEntityMap,
  patches: UnitPatch[]
): Array<Update<Unit, string>> => {
  return patches
    .filter((patch) => entities[patch.id] !== undefined)
    .map((patch) => ({
      id: patch.id,
      changes: {
        ...patch.changes,
        version: patch.version
      }
    }));
};
