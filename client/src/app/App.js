import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Dashboard } from '../features/dashboard/Dashboard';
import { fetchInitialUnits } from '../lib/api';
import { connectUnitStream } from '../lib/sse';
import { useAppDispatch } from '../store/hooks';
import { setAllUnits, upsertUnitDeltas } from '../entities/units/store';
export const App = () => {
    const dispatch = useAppDispatch();
    useEffect(() => {
        let active = true;
        // TODO: add loading/error state to avoid silent fetch failures in UI.
        void fetchInitialUnits().then((units) => {
            if (active) {
                dispatch(setAllUnits(units));
            }
        });
        const close = connectUnitStream((payload) => {
            dispatch(upsertUnitDeltas(payload.updates));
        });
        return () => {
            active = false;
            close();
        };
    }, [dispatch]);
    return _jsx(Dashboard, {});
};
