import type { TickDelta } from '../entities/units/types';

const STREAM_URL = 'http://localhost:4000/api/stream';

interface ConnectStreamOptions {
  sinceTick?: number;
  onReady: (meta: { tickNumber: number; serverTime: number }) => void;
  onTickDelta: (delta: TickDelta) => void;
  onHeartbeat: (meta: { serverTime: number }) => void;
  onError: (error: Error) => void;
}

const toQuery = (sinceTick?: number): string => {
  if (sinceTick === undefined) {
    return '';
  }
  const params = new URLSearchParams({ sinceTick: String(sinceTick) });
  return `?${params.toString()}`;
};

export const connectUnitStream = (options: ConnectStreamOptions): (() => void) => {
  const stream = new EventSource(`${STREAM_URL}${toQuery(options.sinceTick)}`);

  stream.addEventListener('ready', (event) => {
    if (!(event instanceof MessageEvent)) {
      return;
    }

    const payload = JSON.parse(event.data) as { tickNumber: number; serverTime: number };
    options.onReady(payload);
  });

  stream.addEventListener('tick.delta', (event) => {
    if (!(event instanceof MessageEvent)) {
      return;
    }

    const payload = JSON.parse(event.data) as TickDelta;
    options.onTickDelta(payload);
  });

  stream.addEventListener('heartbeat', (event) => {
    if (!(event instanceof MessageEvent)) {
      return;
    }

    const payload = JSON.parse(event.data) as { serverTime: number };
    options.onHeartbeat(payload);
  });

  stream.onerror = () => {
    options.onError(new Error('SSE connection error'));
  };

  return () => {
    stream.close();
  };
};
