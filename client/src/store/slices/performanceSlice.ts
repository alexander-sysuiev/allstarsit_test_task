import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PerformanceState {
  ticksReceived: number;
  lastLatencyMs: number;
  averagePatchesPerTick: number;
  maxPatchesInTick: number;
  lastServerTime: number;
}

const initialState: PerformanceState = {
  ticksReceived: 0,
  lastLatencyMs: 0,
  averagePatchesPerTick: 0,
  maxPatchesInTick: 0,
  lastServerTime: 0
};

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    recordTickMetrics: (
      state,
      action: PayloadAction<{ serverTime: number; patchCount: number; receivedAt: number }>
    ) => {
      const { serverTime, patchCount, receivedAt } = action.payload;
      state.ticksReceived += 1;
      state.lastServerTime = serverTime;
      state.lastLatencyMs = Math.max(0, receivedAt - serverTime);
      state.maxPatchesInTick = Math.max(state.maxPatchesInTick, patchCount);

      const prevAvg = state.averagePatchesPerTick;
      state.averagePatchesPerTick =
        ((prevAvg * (state.ticksReceived - 1)) + patchCount) / state.ticksReceived;
    },
    resetPerformance: () => initialState
  }
});

export const { recordTickMetrics, resetPerformance } = performanceSlice.actions;
export const performanceReducer = performanceSlice.reducer;
