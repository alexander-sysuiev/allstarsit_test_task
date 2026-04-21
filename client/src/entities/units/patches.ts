import type { Unit, UnitPatch } from './types';

type UnitEntityMap = Record<string, Unit | undefined>;
type UnitUpdate = {
  id: string;
  changes: Partial<Unit>;
};

export const buildUnitPatchUpdates = (
  entities: UnitEntityMap,
  patches: UnitPatch[]
): UnitUpdate[] => {
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
