import cors from 'cors';
import express from 'express';
import { TICK_MS } from './config/constants.js';
import { createInitialSnapshot } from './domain/createInitialUnits.js';
import { UnitSimulationService } from './services/unitSimulationService.js';
import { SseBroadcaster } from './transport/sseBroadcaster.js';

export const createApp = () => {
  const app = express();
  const initialSnapshot = createInitialSnapshot();
  const simulation = new UnitSimulationService(initialSnapshot.units);
  const broadcaster = new SseBroadcaster();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, clients: broadcaster.count(), units: initialSnapshot.units.length });
  });

  app.get('/api/units', (_req, res) => {
    res.json({
      snapshot: {
        tickNumber: 0,
        units: simulation.getSnapshot(),
        kpis: initialSnapshot.kpis
      }
    });
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
    const tick = simulation.tick();

    if (tick.changedUnits.length > 0 || tick.events.length > 0) {
      broadcaster.send('units.delta', tick);
    }
  }, TICK_MS);

  return app;
};
