import { EventFeed } from '../events/EventFeed';
import { KpiCards } from '../kpis/KpiCards';
import { MapCanvas } from '../map/MapCanvas';
import { UnitList } from '../unit-list/UnitList';
import { useAppSelector } from '../../store/hooks';

export const Dashboard = (): JSX.Element => {
  const filters = useAppSelector((state) => state.filters);
  const performance = useAppSelector((state) => state.performance);

  return (
    <main className="layout">
      <section className="layout-full">
        <h1>Battle Dashboard</h1>
        <KpiCards />
      </section>

      <section className="panel metrics">
        <h2>Filters (Placeholder)</h2>
        <p>Team: {filters.team}</p>
        <p>Zone: {filters.zone}</p>
        <p>Include destroyed: {String(filters.includeDestroyed)}</p>
      </section>

      <section className="panel metrics">
        <h2>Performance</h2>
        <p>Ticks received: {performance.ticksReceived}</p>
        <p>Update rate: {performance.updatesPerSecond.toFixed(2)} /s</p>
        <p>Avg update rate: {performance.averageUpdatesPerSecond.toFixed(2)} /s</p>
        <p>Latency: {performance.lastLatencyMs} ms</p>
        <p>Avg patches/tick: {performance.averagePatchesPerTick.toFixed(1)}</p>
        <p>Max patches/tick: {performance.maxPatchesInTick}</p>
      </section>

      <section className="panel map">
        <h2>Map</h2>
        <MapCanvas />
      </section>

      <section className="panel list">
        <h2>Units</h2>
        <UnitList />
      </section>

      <section className="panel list">
        <h2>Events Feed</h2>
        <EventFeed />
      </section>
    </main>
  );
};
