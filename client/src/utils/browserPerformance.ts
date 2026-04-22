const PUBLISH_INTERVAL_MS = 500;

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
  tickDeliveryLatencyMs: number | null;
}

interface PublishStats {
  frameCount: number;
  frameTimeSum: number;
}

let latestTickDeliveryLatencyMs: number | null = null;

const initialSnapshot = (): PerformanceSnapshot => ({
  fps: 0,
  frameTimeMs: 0,
  heapUsedMb: null,
  tickDeliveryLatencyMs: null
});

export const recordTickDeliveryLatency = (serverTime: number): void => {
  latestTickDeliveryLatencyMs = Math.max(0, Date.now() - serverTime);
};

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
    frameTimeSum: 0
  };

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
  }

  private readonly onFrame = (now: number): void => {
    if (this.lastFrameAt > 0) {
      this.publishStats.frameCount += 1;
      this.publishStats.frameTimeSum += now - this.lastFrameAt;
    }

    this.lastFrameAt = now;
    this.frameId = requestAnimationFrame(this.onFrame);
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
      tickDeliveryLatencyMs: latestTickDeliveryLatencyMs
    });

    this.publishStats.frameCount = 0;
    this.publishStats.frameTimeSum = 0;
  };
}
