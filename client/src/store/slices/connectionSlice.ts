import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ConnectionPhase = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface ConnectionState {
  phase: ConnectionPhase;
  lastError: string | null;
  lastConnectedAt: number | null;
}

const initialState: ConnectionState = {
  phase: 'idle',
  lastError: null,
  lastConnectedAt: null
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnecting: (state) => {
      state.phase = 'connecting';
      state.lastError = null;
    },
    setReconnecting: (state) => {
      state.phase = 'reconnecting';
    },
    setConnected: (state, action: PayloadAction<{ at: number }>) => {
      state.phase = 'connected';
      state.lastConnectedAt = action.payload.at;
      state.lastError = null;
    },
    setConnectionError: (state, action: PayloadAction<{ message: string }>) => {
      state.phase = 'error';
      state.lastError = action.payload.message;
    }
  }
});

export const { setConnecting, setReconnecting, setConnected, setConnectionError } = connectionSlice.actions;
export const connectionReducer = connectionSlice.reducer;
