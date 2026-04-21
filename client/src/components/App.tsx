import { useEffect } from 'react';
import { fetchInitialSnapshot } from '../lib/api';
import { connectUnitStream } from '../lib/sse';
import { appStore } from '../store';
import { applyTickDeltaToStore } from '../store/services/applyTickDelta';
import { Dashboard } from './Dashboard';

const RECONNECT_DELAY_MS = 1_500;

export const App = (): JSX.Element => {
  useEffect(() => {
    let active = true;
    let closeStream: (() => void) | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let currentTick = 0;
    const { actions } = appStore.getState();

    const connect = (sinceTick?: number): void => {
      closeStream = connectUnitStream({
        sinceTick,
        onReady: ({ serverTime }) => {
          if (!active) {
            return;
          }
          actions.setConnected({ at: serverTime });
        },
        onTickDelta: (delta) => {
          if (!active) {
            return;
          }
          currentTick = Math.max(currentTick, delta.tickNumber);
          applyTickDeltaToStore(delta);
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

          actions.setConnectionError({ message: error.message });
          actions.setReconnecting();

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

    actions.setConnecting();

    void fetchInitialSnapshot()
      .then((snapshot) => {
        if (!active) {
          return;
        }

        currentTick = snapshot.tickNumber;

        actions.setSnapshotUnits({
          units: snapshot.units,
          tickNumber: snapshot.tickNumber
        });

        actions.setKpisSnapshot({
          tickNumber: snapshot.tickNumber,
          kpis: snapshot.kpis
        });

        connect(snapshot.tickNumber);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to load snapshot';
        actions.setConnectionError({ message });
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
  }, []);

  return <Dashboard />;
};
