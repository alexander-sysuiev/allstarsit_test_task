import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
const unitsAdapter = createEntityAdapter();
const unitsSlice = createSlice({
    name: 'units',
    initialState: unitsAdapter.getInitialState(),
    reducers: {
        setAllUnits: (state, action) => {
            unitsAdapter.setAll(state, action.payload);
        },
        upsertUnitDeltas: (state, action) => {
            // TODO: ignore out-of-order events using sequence numbers when backend adds them.
            const updates = action.payload.map((delta) => ({
                id: delta.id,
                changes: {
                    ...(delta.x !== undefined ? { x: delta.x } : {}),
                    ...(delta.y !== undefined ? { y: delta.y } : {}),
                    ...(delta.hp !== undefined ? { hp: delta.hp } : {}),
                    ...(delta.status !== undefined ? { status: delta.status } : {})
                }
            }));
            unitsAdapter.updateMany(state, updates);
        }
    }
});
export const { setAllUnits, upsertUnitDeltas } = unitsSlice.actions;
export const unitsReducer = unitsSlice.reducer;
export const unitsSelectors = unitsAdapter.getSelectors((state) => state.units);
