import type { TickDelta } from '../../entities/units/types';
import { applyUnitPatches } from '../../entities/units/store';
import type { AppDispatch } from '../index';
import { appendEvents } from '../slices/eventsFeedSlice';
import { setKpisFromDelta } from '../slices/kpisSlice';

export const applyTickDeltaToStore = (dispatch: AppDispatch, delta: TickDelta): void => {
  // Tick payloads carry only changed units; reducer applies field-level patches in place.
  dispatch(
    applyUnitPatches({
      patches: delta.changedUnits,
      tickNumber: delta.tickNumber
    })
  );

  if (delta.events.length > 0) {
    dispatch(appendEvents(delta.events));
  }

  dispatch(
    setKpisFromDelta({
      tickNumber: delta.tickNumber,
      kpis: delta.kpis
    })
  );
};
