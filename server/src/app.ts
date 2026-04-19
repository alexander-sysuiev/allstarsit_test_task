import cors from 'cors';
import express from 'express';
import { TICK_MS } from './config/constants.js';
import { createInitialUnits } from './domain/createInitialUnits.js';
import { UnitSimulationService } from './services/unitSimulationService.js';
import { SseBroadcaster } from './transport/sseBroadcaster.js';

export const createApp = () => {
  const app = express();
  // TODO: Replace naive random updates with deterministic, testable simulation rules.
  const simulation = new UnitSimulationService(createInitialUnits());
  const broadcaster = new SseBroadcaster();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, clients: broadcaster.count() });
  });

  app.get('/api/units', (_req, res) => {
    res.json({ units: simulation.getSnapshot() });
  });

  app.get('/api/stream', (_req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    broadcaster.addClient(res);

    res.write(`event: ready\ndata: ${JSON.stringify({ connected: true })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 15_000);

    res.on('close', () => {
      clearInterval(heartbeat);
      broadcaster.removeClient(res);
      res.end();
    });
  });

  setInterval(() => {
    const updates = simulation.tick();

    if (updates.length > 0) {
      broadcaster.send('units.delta', { updates, ts: Date.now() });
    }
  }, TICK_MS);

  return app;
};
