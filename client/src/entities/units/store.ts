import type { RootState } from '../../store';
import type { Unit } from './types';

export const unitsSelectors = {
  selectAll: (state: RootState): Unit[] =>
    state.units.allIds
      .map((id) => state.units.byId[id])
      .filter((unit): unit is Unit => unit !== undefined)
};

export const selectLastAppliedTick = (state: RootState): number => state.units.lastAppliedTick;
