import type { TickDelta } from '../../entities/units/types';
import { appStore } from '../index';

export const applyTickDeltaToStore = (delta: TickDelta): void => {
  const { actions } = appStore.getState();

  actions.applyUnitPatches({
    patches: delta.changedUnits,
    tickNumber: delta.tickNumber
  });

  if (delta.events.length > 0) {
    actions.appendEvents(delta.events);
  }

  actions.setKpisFromDelta({
    tickNumber: delta.tickNumber,
    kpis: delta.kpis
  });
};
