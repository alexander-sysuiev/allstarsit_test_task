import type express from 'express';
import type { TickDelta } from './domain/domain.types.js';

export interface AppRuntimeOptions {
  autoTick?: boolean;
  tickMs?: number;
  heartbeatMs?: number;
}

export interface AppRuntime {
  app: ReturnType<typeof express>;
  runTick: () => TickDelta;
  dispose: () => void;
}
