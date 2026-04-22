import assert from 'node:assert/strict';
import http from 'node:http';
import type { Socket } from 'node:net';
import test from 'node:test';
import { createAppRuntime, type AppRuntime } from '../../src/app.js';
import type { InitialSnapshot, TickDelta, Unit } from '../../src/domain/battlefield.types.js';

interface RunningServer {
  baseUrl: string;
  runtime: AppRuntime;
  close: () => Promise<void>;
}

interface ParsedSseEvent<TPayload = unknown> {
  event: string;
  data: TPayload;
}

interface SseClient {
  close: () => void;
  nextEvent: <TPayload>(eventName: string, timeoutMs?: number) => Promise<ParsedSseEvent<TPayload>>;
}

const startServer = async (): Promise<RunningServer> => {
  const runtime = createAppRuntime({ autoTick: false });
  const server = http.createServer(runtime.app);
  const sockets = new Set<Socket>();

  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => {
      sockets.delete(socket);
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to start test server');
  }

  return {
    runtime,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      runtime.dispose();
      for (const socket of sockets) {
        socket.destroy();
      }
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  };
};

const fetchSnapshot = async (baseUrl: string): Promise<InitialSnapshot> => {
  const res = await fetch(`${baseUrl}/api/snapshot`);
  assert.equal(res.status, 200);
  return (await res.json()) as InitialSnapshot;
};

const connectSse = async (url: string): Promise<SseClient> => {
  const queuedEvents: ParsedSseEvent[] = [];
  let pending:
    | {
        eventName: string;
        resolve: (event: ParsedSseEvent) => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    | null = null;
  let buffer = '';

  const pushEvent = (event: ParsedSseEvent): void => {
    if (pending && pending.eventName === event.event) {
      clearTimeout(pending.timer);
      pending.resolve(event);
      pending = null;
      return;
    }

    queuedEvents.push(event);
  };

  const handleChunk = (chunk: string): void => {
    buffer += chunk;

    while (true) {
      const boundary = buffer.indexOf('\n\n');
      if (boundary === -1) {
        return;
      }

      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      let eventName = 'message';
      const dataLines: string[] = [];

      for (const line of block.split('\n')) {
        if (line.startsWith('event: ')) {
          eventName = line.slice('event: '.length);
          continue;
        }

        if (line.startsWith('data: ')) {
          dataLines.push(line.slice('data: '.length));
        }
      }

      if (dataLines.length === 0) {
        continue;
      }

      pushEvent({
        event: eventName,
        data: JSON.parse(dataLines.join('\n'))
      });
    }
  };

  const request = http.get(url);

  await new Promise<void>((resolve, reject) => {
    request.once('response', (res) => {
      res.setEncoding('utf8');
      res.on('data', handleChunk);
      res.once('end', () => {
        if (pending) {
          clearTimeout(pending.timer);
          pending.reject(new Error('SSE stream ended before receiving event'));
          pending = null;
        }
      });
      resolve();
    });

    request.once('error', (error) => {
      reject(error);
    });
  });

  return {
    close: () => {
      if (pending) {
        clearTimeout(pending.timer);
        pending.reject(new Error('SSE client closed'));
        pending = null;
      }
      request.destroy();
    },
    nextEvent: <TPayload>(eventName: string, timeoutMs = 1_000): Promise<ParsedSseEvent<TPayload>> => {
      const queuedIndex = queuedEvents.findIndex((event) => event.event === eventName);
      if (queuedIndex >= 0) {
        const [event] = queuedEvents.splice(queuedIndex, 1);
        return Promise.resolve(event as ParsedSseEvent<TPayload>);
      }

      return new Promise<ParsedSseEvent<TPayload>>((resolve, reject) => {
        pending = {
          eventName,
          resolve: (event) => resolve(event as ParsedSseEvent<TPayload>),
          reject,
          timer: setTimeout(() => {
            pending = null;
            reject(new Error(`Timed out waiting for SSE event: ${eventName}`));
          }, timeoutMs)
        };
      });
    }
  };
};

const toUnitsById = (units: Unit[]): Map<string, Unit> => {
  return new Map(units.map((unit) => [unit.id, unit]));
};

test('snapshot baseline stays consistent with the next streamed delta', async (t) => {
  const server = await startServer();
  t.after(async () => {
    await server.close();
  });

  const snapshotBefore = await fetchSnapshot(server.baseUrl);
  const stream = await connectSse(`${server.baseUrl}/api/stream?sinceTick=${snapshotBefore.tickNumber}`);

  t.after(() => {
    stream.close();
  });

  const ready = await stream.nextEvent<{ tickNumber: number }>('ready');
  assert.equal(ready.data.tickNumber, snapshotBefore.tickNumber);

  const emittedTick = server.runtime.runTick();
  const streamedDelta = await stream.nextEvent<TickDelta>('tick.delta');
  const snapshotAfter = await fetchSnapshot(server.baseUrl);

  assert.equal(streamedDelta.data.tickNumber, emittedTick.tickNumber);
  assert.equal(snapshotAfter.tickNumber, streamedDelta.data.tickNumber);
  assert.deepEqual(snapshotAfter.kpis, streamedDelta.data.kpis);
  assert.equal(snapshotAfter.units.length, snapshotBefore.units.length);

  const unitsBeforeById = toUnitsById(snapshotBefore.units);
  const unitsAfterById = toUnitsById(snapshotAfter.units);

  for (const patch of streamedDelta.data.changedUnits) {
    const beforeUnit = unitsBeforeById.get(patch.id);
    const afterUnit = unitsAfterById.get(patch.id);

    assert.ok(beforeUnit);
    assert.ok(afterUnit);
    assert.deepEqual(afterUnit, {
      ...beforeUnit,
      ...patch.changes,
      version: patch.version
    });
  }
});

test('stream replays missed deltas after reconnect using sinceTick', async (t) => {
  const server = await startServer();
  t.after(async () => {
    await server.close();
  });

  const initialSnapshot = await fetchSnapshot(server.baseUrl);
  assert.equal(initialSnapshot.tickNumber, 0);

  const tickOne = server.runtime.runTick();
  const tickTwo = server.runtime.runTick();

  const firstStream = await connectSse(`${server.baseUrl}/api/stream?sinceTick=${initialSnapshot.tickNumber}`);
  t.after(() => {
    firstStream.close();
  });

  const ready = await firstStream.nextEvent<{ tickNumber: number }>('ready');
  assert.equal(ready.data.tickNumber, tickTwo.tickNumber);

  const replayedOne = await firstStream.nextEvent<TickDelta>('tick.delta');
  const replayedTwo = await firstStream.nextEvent<TickDelta>('tick.delta');

  assert.equal(replayedOne.data.tickNumber, tickOne.tickNumber);
  assert.equal(replayedTwo.data.tickNumber, tickTwo.tickNumber);

  firstStream.close();

  const tickThree = server.runtime.runTick();
  const secondStream = await connectSse(`${server.baseUrl}/api/stream?sinceTick=${tickTwo.tickNumber}`);
  t.after(() => {
    secondStream.close();
  });

  const reconnectReady = await secondStream.nextEvent<{ tickNumber: number }>('ready');
  assert.equal(reconnectReady.data.tickNumber, tickThree.tickNumber);

  const replayedThree = await secondStream.nextEvent<TickDelta>('tick.delta');
  assert.equal(replayedThree.data.tickNumber, tickThree.tickNumber);
});
