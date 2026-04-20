import { configureStore } from '@reduxjs/toolkit';
import { unitsReducer } from '../entities/units/store';
import { connectionReducer } from './slices/connectionSlice';
import { eventsFeedReducer } from './slices/eventsFeedSlice';
import { filtersReducer } from './slices/filtersSlice';
import { kpisReducer } from './slices/kpisSlice';
import { performanceReducer } from './slices/performanceSlice';

export const store = configureStore({
  reducer: {
    units: unitsReducer,
    filters: filtersReducer,
    eventsFeed: eventsFeedReducer,
    kpis: kpisReducer,
    performance: performanceReducer,
    connection: connectionReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
