import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Team, Zone } from '../../entities/units/types';

export interface FiltersState {
  team: Team | 'all';
  zone: Zone | 'all';
  includeDestroyed: boolean;
}

const initialState: FiltersState = {
  team: 'all',
  zone: 'all',
  includeDestroyed: true
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setTeamFilter: (state, action: PayloadAction<Team | 'all'>) => {
      state.team = action.payload;
    },
    setZoneFilter: (state, action: PayloadAction<Zone | 'all'>) => {
      state.zone = action.payload;
    },
    setIncludeDestroyed: (state, action: PayloadAction<boolean>) => {
      state.includeDestroyed = action.payload;
    }
  }
});

export const { setTeamFilter, setZoneFilter, setIncludeDestroyed } = filtersSlice.actions;
export const filtersReducer = filtersSlice.reducer;
