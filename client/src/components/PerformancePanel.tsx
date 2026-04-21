import { memo, useEffect, useState } from 'react';
import { BrowserPerformanceMonitor, type PerformanceSnapshot } from '../features/performance/browserPerformance';

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
        <div className="performance-metrics-list">
          <div className="performance-metric">
            <span className="sketch-box" />
            <div>
              <span className="performance-label">FPS</span>
              <strong>{snapshot.fps.toFixed(1)}</strong>
            </div>
          </div>

          <div className="performance-metric">
            <span className="sketch-box" />
            <div>
              <span className="performance-label">Frame time</span>
              <strong>{formatMs(snapshot.frameTimeMs)}</strong>
            </div>
          </div>

          <div className="performance-metric">
            <span className="sketch-box" />
            <div>
              <span className="performance-label">JS heap usage</span>
              <strong>{formatMb(snapshot.heapUsedMb)}</strong>
            </div>
          </div>

          <div className="performance-metric">
            <span className="sketch-box" />
            <div>
              <span className="performance-label">API latency</span>
              <strong>{formatMs(snapshot.apiLatencyMs)}</strong>
            </div>
          </div>
        </div>

        <div className="performance-placeholder">
          <div className="performance-placeholder-copy">
            <span className="performance-placeholder-title">Performance Stats</span>
            <span className="performance-subtle">Heap limit: {formatMb(snapshot.heapLimitMb)}</span>
            <span className="performance-subtle">
              Store updates: {snapshot.storeUpdatesPerSecond.toFixed(1)} /s
            </span>
            <span className="performance-subtle">
              Long tasks: {snapshot.longTasksPerMinute} /min | Max {formatMs(snapshot.maxLongTaskMs)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export const PerformancePanel = memo(PerformancePanelComponent);
