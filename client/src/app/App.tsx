import { useEffect } from 'react';
import { setSnapshotUnits } from '../entities/units/store';
import { Dashboard } from '../features/dashboard/Dashboard';
import { fetchInitialSnapshot } from '../lib/api';
import { connectUnitStream } from '../lib/sse';
import { useAppDispatch } from '../store/hooks';
import {
  setConnected,
  setConnectionError,
  setConnecting,
  setReconnecting
} from '../store/slices/connectionSlice';
import { setKpisSnapshot } from '../store/slices/kpisSlice';
import { applyTickDeltaToStore } from '../store/services/applyTickDelta';

const RECONNECT_DELAY_MS = 1_500;

export const App = (): JSX.Element => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let active = true;
    let closeStream: (() => void) | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let currentTick = 0;

    const connect = (sinceTick?: number): void => {
      closeStream = connectUnitStream({
        sinceTick,
        onReady: ({ serverTime }) => {
          if (!active) {
            return;
          }
          dispatch(setConnected({ at: serverTime }));
        },
        onTickDelta: (delta) => {
          if (!active) {
            return;
          }
          currentTick = Math.max(currentTick, delta.tickNumber);
          applyTickDeltaToStore(dispatch, delta);
        },
        onHeartbeat: () => {
          // TODO: expose heartbeat metrics in dedicated monitoring panel if needed.
        },
        onError: (error) => {
          if (!active) {
            return;
          }

          if (closeStream !== null) {
            closeStream();
            closeStream = null;
          }

          dispatch(setConnectionError({ message: error.message }));
          dispatch(setReconnecting());

          if (reconnectTimer !== null) {
            clearTimeout(reconnectTimer);
          }

          reconnectTimer = setTimeout(() => {
            if (!active) {
              return;
            }
            connect(currentTick);
          }, RECONNECT_DELAY_MS);
        }
      });
    };

    dispatch(setConnecting());

    void fetchInitialSnapshot()
      .then((snapshot) => {
        if (!active) {
          return;
        }

        currentTick = snapshot.tickNumber;

        dispatch(
          setSnapshotUnits({
            units: snapshot.units,
            tickNumber: snapshot.tickNumber
          })
        );

        dispatch(
          setKpisSnapshot({
            tickNumber: snapshot.tickNumber,
            kpis: snapshot.kpis
          })
        );

        connect(snapshot.tickNumber);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to load snapshot';
        dispatch(setConnectionError({ message }));
      });

    return () => {
      active = false;
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
      }
      if (closeStream !== null) {
        closeStream();
      }
    };
  }, [dispatch]);

  return <Dashboard />;
};
