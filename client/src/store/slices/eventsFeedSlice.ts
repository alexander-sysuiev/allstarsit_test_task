import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BattleEvent } from '../../entities/units/types';

const MAX_EVENTS = 500;

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
      state.items.unshift(...action.payload);
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
