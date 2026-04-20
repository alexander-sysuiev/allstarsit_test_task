import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BattlefieldKpis } from '../../entities/units/types';

export interface KpisState {
  tickNumber: number;
  data: BattlefieldKpis | null;
}

const initialState: KpisState = {
  tickNumber: 0,
  data: null
};

const kpisSlice = createSlice({
  name: 'kpis',
  initialState,
  reducers: {
    setKpisSnapshot: (state, action: PayloadAction<{ tickNumber: number; kpis: BattlefieldKpis }>) => {
      state.tickNumber = action.payload.tickNumber;
      state.data = action.payload.kpis;
    },
    setKpisFromDelta: (state, action: PayloadAction<{ tickNumber: number; kpis: BattlefieldKpis }>) => {
      state.tickNumber = Math.max(state.tickNumber, action.payload.tickNumber);
      state.data = action.payload.kpis;
    }
  }
});

export const { setKpisSnapshot, setKpisFromDelta } = kpisSlice.actions;
export const kpisReducer = kpisSlice.reducer;
