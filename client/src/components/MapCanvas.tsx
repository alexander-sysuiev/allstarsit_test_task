import { memo, useEffect, useRef } from 'react';
import { unitsSelectors, selectLastAppliedTick } from '../entities/units/store';
import { store } from '../store';
import { TacticalMapRenderer } from '../features/map/tacticalMapRenderer';

const MapCanvasComponent = (): JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    // Canvas keeps 20k units on a single surface. A DOM/SVG approach would
    // create and update thousands of nodes every tick, which is a worse fit here.
    const renderer = new TacticalMapRenderer(canvas);

    const syncRenderer = (): void => {
      const state = store.getState();

      renderer.setScene({
        units: unitsSelectors.selectAll(state),
        filters: state.filters,
        tickNumber: selectLastAppliedTick(state)
      });
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      renderer.resize(entry.contentRect.width, entry.contentRect.height);
    });

    resizeObserver.observe(container);
    syncRenderer();

    const unsubscribe = store.subscribe(syncRenderer);

    return () => {
      unsubscribe();
      resizeObserver.disconnect();
      renderer.destroy();
    };
  }, []);

  return (
    <section className="panel panel-map">
      <div className="panel-heading">
        <h2>Tactical Map</h2>
      </div>
      <div ref={containerRef} className="map-canvas-shell">
        <canvas ref={canvasRef} className="map-canvas" />
      </div>
    </section>
  );
};

export const MapCanvas = memo(MapCanvasComponent);
