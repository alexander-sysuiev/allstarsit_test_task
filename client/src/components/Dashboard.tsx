import { EventFeed } from './EventFeed';
import { KpiCards } from './KpiCards';
import { LegendPanel } from './LegendPanel';
import { MapCanvas } from './MapCanvas';
import { PerformancePanel } from './PerformancePanel';
import { UnitList } from './UnitList';

export const Dashboard = (): JSX.Element => {
  return (
    <main className="dashboard-shell">
      <section className="dashboard-header">
        <h1 className="dashboard-title">War Room Control Dashboard</h1>
        <KpiCards />
      </section>

      <section className="layout-top">
        <MapCanvas />

        <div className="side-stack">
          <UnitList />
          <EventFeed />
        </div>
      </section>

      <section className="layout-bottom">
        <LegendPanel />
        <PerformancePanel />
      </section>
    </main>
  );
};
