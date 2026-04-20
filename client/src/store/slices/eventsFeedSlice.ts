import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BattleEvent } from '../../entities/units/types';

const MAX_EVENTS = 200;
const VISIBLE_EVENT_TYPES = new Set(['attack', 'destroy', 'capture', 'heal']);

export interface EventsFeedState {
  items: BattleEvent[];
}

const initialState: EventsFeedState = {
  items: []
};

const eventsFeedSlice = createSlice({
  name: 'eventsFeed',
  initialState,
  reducers: {
    appendEvents: (state, action: PayloadAction<BattleEvent[]>) => {
      // Keep only the event types shown in the live feed, newest first,
      // and cap history so long sessions do not grow memory without bound.
      const nextEvents = action.payload.filter((event) => VISIBLE_EVENT_TYPES.has(event.type)).reverse();
      if (nextEvents.length === 0) {
        return;
      }

      state.items.unshift(...nextEvents);
      if (state.items.length > MAX_EVENTS) {
        state.items.length = MAX_EVENTS;
      }
    },
    clearEvents: (state) => {
      state.items = [];
    }
  }
});

export const { appendEvents, clearEvents } = eventsFeedSlice.actions;
export const eventsFeedReducer = eventsFeedSlice.reducer;
