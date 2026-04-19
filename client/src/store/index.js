import { configureStore } from '@reduxjs/toolkit';
import { unitsReducer } from '../entities/units/store';
export const store = configureStore({
    reducer: {
        units: unitsReducer
    }
});
