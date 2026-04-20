import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PerformanceState {
  ticksReceived: number;
  lastLatencyMs: number;
  averagePatchesPerTick: number;
  maxPatchesInTick: number;
  lastServerTime: number;
  lastTickReceivedAt: number;
  updatesPerSecond: number;
  averageUpdatesPerSecond: number;
}

const initialState: PerformanceState = {
  ticksReceived: 0,
  lastLatencyMs: 0,
  averagePatchesPerTick: 0,
  maxPatchesInTick: 0,
  lastServerTime: 0,
  lastTickReceivedAt: 0,
  updatesPerSecond: 0,
  averageUpdatesPerSecond: 0
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

      // Store update rate = incoming tick deltas per second at the reducer boundary.
      if (state.lastTickReceivedAt > 0) {
        const deltaMs = Math.max(1, receivedAt - state.lastTickReceivedAt);
        state.updatesPerSecond = 1000 / deltaMs;
      }
      state.lastTickReceivedAt = receivedAt;

      const prevRateAvg = state.averageUpdatesPerSecond;
      state.averageUpdatesPerSecond =
        ((prevRateAvg * (state.ticksReceived - 1)) + state.updatesPerSecond) / state.ticksReceived;
    },
    resetPerformance: () => initialState
  }
});

export const { recordTickMetrics, resetPerformance } = performanceSlice.actions;
export const performanceReducer = performanceSlice.reducer;
