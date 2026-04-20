import { memo, useEffect, useState } from 'react';
import { BrowserPerformanceMonitor, type PerformanceSnapshot } from './browserPerformance';

const EMPTY_SNAPSHOT: PerformanceSnapshot = {
  fps: 0,
  frameTimeMs: 0,
  heapUsedMb: null,
  heapLimitMb: null,
  apiLatencyMs: null,
  longTasksPerMinute: 0,
  maxLongTaskMs: 0,
  storeUpdatesPerSecond: 0
};

const formatMs = (value: number | null): string => {
  if (value === null) {
    return 'n/a';
  }

  return `${value.toFixed(1)} ms`;
};

const formatMb = (value: number | null): string => {
  if (value === null) {
    return 'n/a';
  }

  return `${value.toFixed(1)} MB`;
};

const PerformancePanelComponent = (): JSX.Element => {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    const monitor = new BrowserPerformanceMonitor(setSnapshot);
    monitor.start();

    return () => {
      monitor.stop();
    };
  }, []);

  return (
    <section className="performance-panel">
      <div className="performance-grid">
        <div className="performance-metric">
          <span className="performance-label">FPS</span>
          <strong>{snapshot.fps.toFixed(1)}</strong>
        </div>

        <div className="performance-metric">
          <span className="performance-label">Frame Time</span>
          <strong>{formatMs(snapshot.frameTimeMs)}</strong>
        </div>

        <div className="performance-metric">
          <span className="performance-label">Heap Usage</span>
          <strong>{formatMb(snapshot.heapUsedMb)}</strong>
          <span className="performance-subtle">Limit: {formatMb(snapshot.heapLimitMb)}</span>
        </div>

        <div className="performance-metric">
          <span className="performance-label">API Latency</span>
          <strong>{formatMs(snapshot.apiLatencyMs)}</strong>
        </div>

        <div className="performance-metric">
          <span className="performance-label">Store Updates</span>
          <strong>{snapshot.storeUpdatesPerSecond.toFixed(1)} /s</strong>
        </div>

        <div className="performance-metric">
          <span className="performance-label">Long Tasks</span>
          <strong>{snapshot.longTasksPerMinute} /min</strong>
          <span className="performance-subtle">Max: {formatMs(snapshot.maxLongTaskMs)}</span>
        </div>
      </div>
    </section>
  );
};

export const PerformancePanel = memo(PerformancePanelComponent);
