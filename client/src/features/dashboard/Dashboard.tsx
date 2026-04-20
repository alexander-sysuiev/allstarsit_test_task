import { EventFeed } from '../events/EventFeed';
import { KpiCards } from '../kpis/KpiCards';
import { MapCanvas } from '../map/MapCanvas';
import { PerformancePanel } from '../performance/PerformancePanel';
import { UnitList } from '../unit-list/UnitList';
import { useAppSelector } from '../../store/hooks';

export const Dashboard = (): JSX.Element => {
  const filters = useAppSelector((state) => state.filters);

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
        <PerformancePanel />
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
