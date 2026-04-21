import { store } from '../store';

const PUBLISH_INTERVAL_MS = 500;
const API_MEASURE_PREFIX = 'api:';

type MemoryPerformance = Performance & {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

export interface PerformanceSnapshot {
  fps: number;
  frameTimeMs: number;
  heapUsedMb: number | null;
  heapLimitMb: number | null;
  apiLatencyMs: number | null;
  longTasksPerMinute: number;
  maxLongTaskMs: number;
  storeUpdatesPerSecond: number;
}

interface PublishStats {
  frameCount: number;
  frameTimeSum: number;
  latestApiLatencyMs: number | null;
  storeUpdates: number;
}

interface LongTaskSample {
  timestamp: number;
  duration: number;
}

const initialSnapshot = (): PerformanceSnapshot => ({
  fps: 0,
  frameTimeMs: 0,
  heapUsedMb: null,
  heapLimitMb: null,
  apiLatencyMs: null,
  longTasksPerMinute: 0,
  maxLongTaskMs: 0,
  storeUpdatesPerSecond: 0
});

export class BrowserPerformanceMonitor {
  private readonly publish: (snapshot: PerformanceSnapshot) => void;
  private readonly perf = window.performance as MemoryPerformance;
  private readonly intervalMs: number;
  private frameId: number | null = null;
  private unsubscribeStore: (() => void) | null = null;
  private publishTimer: number | null = null;
  private lastFrameAt = 0;
  private lastPublishAt = 0;
  private publishStats: PublishStats = {
    frameCount: 0,
    frameTimeSum: 0,
    latestApiLatencyMs: null,
    storeUpdates: 0
  };
  private longTasks: LongTaskSample[] = [];
  private resourceObserver: PerformanceObserver | null = null;
  private measureObserver: PerformanceObserver | null = null;
  private longTaskObserver: PerformanceObserver | null = null;

  constructor(publish: (snapshot: PerformanceSnapshot) => void, intervalMs = PUBLISH_INTERVAL_MS) {
    this.publish = publish;
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.frameId !== null) {
      return;
    }

    this.lastPublishAt = performance.now();
    this.lastFrameAt = 0;

    this.frameId = requestAnimationFrame(this.onFrame);
    this.unsubscribeStore = store.subscribe(this.onStoreUpdate);
    this.publishTimer = window.setInterval(this.publishSnapshot, this.intervalMs);

    this.observeMeasures();
    this.observeResources();
    this.observeLongTasks();
    this.publish(initialSnapshot());
  }

  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    if (this.publishTimer !== null) {
      window.clearInterval(this.publishTimer);
      this.publishTimer = null;
    }

    if (this.unsubscribeStore !== null) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }

    this.resourceObserver?.disconnect();
    this.measureObserver?.disconnect();
    this.longTaskObserver?.disconnect();
  }

  private readonly onFrame = (now: number): void => {
    if (this.lastFrameAt > 0) {
      this.publishStats.frameCount += 1;
      this.publishStats.frameTimeSum += now - this.lastFrameAt;
    }

    this.lastFrameAt = now;
    this.frameId = requestAnimationFrame(this.onFrame);
  };

  private readonly onStoreUpdate = (): void => {
    this.publishStats.storeUpdates += 1;
  };

  private readonly onApiEntry = (duration: number): void => {
    if (duration <= 0) {
      return;
    }

    this.publishStats.latestApiLatencyMs = duration;
  };

  private readonly publishSnapshot = (): void => {
    const now = performance.now();
    const elapsedMs = Math.max(1, now - this.lastPublishAt);
    this.lastPublishAt = now;

    this.trimLongTasks(now);

    const frameCount = this.publishStats.frameCount;
    const fps = frameCount > 0 ? (frameCount * 1000) / elapsedMs : 0;
    const frameTimeMs = frameCount > 0 ? this.publishStats.frameTimeSum / frameCount : 0;
    const memory = this.perf.memory;
    const maxLongTaskMs = this.longTasks.reduce((max, task) => Math.max(max, task.duration), 0);

    this.publish({
      fps,
      frameTimeMs,
      heapUsedMb: memory ? memory.usedJSHeapSize / (1024 * 1024) : null,
      heapLimitMb: memory ? memory.jsHeapSizeLimit / (1024 * 1024) : null,
      apiLatencyMs: this.publishStats.latestApiLatencyMs,
      longTasksPerMinute: this.longTasks.length,
      maxLongTaskMs,
      storeUpdatesPerSecond: (this.publishStats.storeUpdates * 1000) / elapsedMs
    });

    this.publishStats.frameCount = 0;
    this.publishStats.frameTimeSum = 0;
    this.publishStats.storeUpdates = 0;
  };

  private observeMeasures(): void {
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }

    this.measureObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.startsWith(API_MEASURE_PREFIX)) {
          this.onApiEntry(entry.duration);
        }
      }
    });

    this.measureObserver.observe({ type: 'measure', buffered: true });
  }

  private observeResources(): void {
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }

    this.resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType !== 'resource') {
          continue;
        }

        if (!entry.name.includes('/api/')) {
          continue;
        }

        this.onApiEntry(entry.duration);
      }
    });

    this.resourceObserver.observe({ type: 'resource', buffered: true });
  }

  private observeLongTasks(): void {
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }

    try {
      this.longTaskObserver = new PerformanceObserver((list) => {
        const now = performance.now();

        for (const entry of list.getEntries()) {
          this.longTasks.push({
            timestamp: now,
            duration: entry.duration
          });
        }

        this.trimLongTasks(now);
      });

      this.longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch {
      this.longTaskObserver = null;
    }
  }

  private trimLongTasks(now: number): void {
    const cutoff = now - 60_000;
    this.longTasks = this.longTasks.filter((task) => task.timestamp >= cutoff);
  }
}
