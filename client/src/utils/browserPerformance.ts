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
  apiLatencyMs: number | null;
}

interface PublishStats {
  frameCount: number;
  frameTimeSum: number;
  latestApiLatencyMs: number | null;
}

const initialSnapshot = (): PerformanceSnapshot => ({
  fps: 0,
  frameTimeMs: 0,
  heapUsedMb: null,
  apiLatencyMs: null
});

export class BrowserPerformanceMonitor {
  private readonly publish: (snapshot: PerformanceSnapshot) => void;
  private readonly perf = window.performance as MemoryPerformance;
  private readonly intervalMs: number;
  private frameId: number | null = null;
  private publishTimer: number | null = null;
  private lastFrameAt = 0;
  private lastPublishAt = 0;
  private publishStats: PublishStats = {
    frameCount: 0,
    frameTimeSum: 0,
    latestApiLatencyMs: null
  };
  private resourceObserver: PerformanceObserver | null = null;
  private measureObserver: PerformanceObserver | null = null;

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
    this.publishTimer = window.setInterval(this.publishSnapshot, this.intervalMs);

    this.observeMeasures();
    this.observeResources();
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

    this.resourceObserver?.disconnect();
    this.measureObserver?.disconnect();
  }

  private readonly onFrame = (now: number): void => {
    if (this.lastFrameAt > 0) {
      this.publishStats.frameCount += 1;
      this.publishStats.frameTimeSum += now - this.lastFrameAt;
    }

    this.lastFrameAt = now;
    this.frameId = requestAnimationFrame(this.onFrame);
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

    const frameCount = this.publishStats.frameCount;
    const fps = frameCount > 0 ? (frameCount * 1000) / elapsedMs : 0;
    const frameTimeMs = frameCount > 0 ? this.publishStats.frameTimeSum / frameCount : 0;
    const memory = this.perf.memory;

    this.publish({
      fps,
      frameTimeMs,
      heapUsedMb: memory ? memory.usedJSHeapSize / (1024 * 1024) : null,
      apiLatencyMs: this.publishStats.latestApiLatencyMs
    });

    this.publishStats.frameCount = 0;
    this.publishStats.frameTimeSum = 0;
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
}
