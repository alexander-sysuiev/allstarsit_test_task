import { performance } from 'node:perf_hooks';

export interface SimulationLoop {
  start: () => void;
  stop: () => void;
}

export const createSimulationLoop = (tickMs: number, onTick: () => void): SimulationLoop => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let nextTickAt = 0;
  let running = false;

  const scheduleNext = (): void => {
    if (!running) {
      return;
    }

    const now = performance.now();
    const delayMs = Math.max(0, nextTickAt - now);

    timer = setTimeout(() => {
      if (!running) {
        return;
      }

      onTick();

      const afterTick = performance.now();
      nextTickAt += tickMs;

      // If the loop falls behind, skip missed slots instead of accumulating drift.
      while (nextTickAt <= afterTick) {
        nextTickAt += tickMs;
      }

      scheduleNext();
    }, delayMs);
  };

  return {
    start: () => {
      if (running) {
        return;
      }

      running = true;
      nextTickAt = performance.now() + tickMs;
      scheduleNext();
    },
    stop: () => {
      running = false;

      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
};
