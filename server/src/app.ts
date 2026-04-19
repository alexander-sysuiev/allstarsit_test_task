import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { TICK_MS } from './config/constants.js';
import { createInitialSnapshot } from './domain/createInitialUnits.js';
import { HttpError } from './errors/httpError.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware.js';
import { UnitSimulationService } from './services/unitSimulationService.js';
import { SseBroadcaster } from './transport/sseBroadcaster.js';
import type { TickDelta } from './domain/battlefield.types.js';

const HEARTBEAT_MS = 15_000;
const MAX_TICK_HISTORY = 300;

const emptyQuerySchema = z.object({}).strict();
const streamQuerySchema = z
  .object({
    sinceTick: z.coerce.number().int().min(0).optional()
  })
  .strict();

const asyncRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

const parseQuery = <TSchema extends z.ZodTypeAny>(schema: TSchema, query: unknown): z.infer<TSchema> => {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new HttpError(400, 'Invalid query parameters', result.error.issues);
  }

  return result.data;
};

export const createApp = () => {
  const app = express();
  const initialSnapshot = createInitialSnapshot();
  const simulation = new UnitSimulationService(initialSnapshot.units);
  const broadcaster = new SseBroadcaster();
  const tickHistory: TickDelta[] = [];

  app.use(cors());
  app.use(express.json());

  app.get(
    '/api/health',
    asyncRoute((req, res) => {
      parseQuery(emptyQuerySchema, req.query);

      res.json({
        ok: true,
        clients: broadcaster.count(),
        tickNumber: simulation.getTickNumber(),
        units: initialSnapshot.units.length
      });
    })
  );

  app.get(
    '/api/snapshot',
    asyncRoute((req, res) => {
      parseQuery(emptyQuerySchema, req.query);

      res.json({
        tickNumber: simulation.getTickNumber(),
        kpis: simulation.getKpis(),
        units: simulation.getSnapshot()
      });
    })
  );

  app.get(
    '/api/stream',
    asyncRoute((req, res) => {
      const { sinceTick } = parseQuery(streamQuerySchema, req.query);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      broadcaster.addClient(res);

      broadcaster.sendTo(res, 'ready', {
        connected: true,
        serverTime: Date.now(),
        tickNumber: simulation.getTickNumber()
      });

      if (sinceTick !== undefined) {
        const missed = tickHistory.filter((tick) => tick.tickNumber > sinceTick);
        for (const tick of missed) {
          broadcaster.sendTo(res, 'tick.delta', tick);
        }
      }

      const heartbeat = setInterval(() => {
        broadcaster.sendTo(res, 'heartbeat', { serverTime: Date.now() });
      }, HEARTBEAT_MS);

      res.on('close', () => {
        clearInterval(heartbeat);
        broadcaster.removeClient(res);
        res.end();
      });
    })
  );

  setInterval(() => {
    const tick = simulation.tick();

    tickHistory.push(tick);
    if (tickHistory.length > MAX_TICK_HISTORY) {
      tickHistory.shift();
    }

    broadcaster.send('tick.delta', tick);
  }, TICK_MS);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
