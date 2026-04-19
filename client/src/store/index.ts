import { configureStore } from '@reduxjs/toolkit';
import { unitsReducer } from '../entities/units/store';

export const store = configureStore({
  reducer: {
    units: unitsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
