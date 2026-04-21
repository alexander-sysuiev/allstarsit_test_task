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
        <section className="panel panel-map">
          <div className="panel-heading">
            <h2>Tactical Map</h2>
          </div>
          <MapCanvas />
        </section>

        <div className="side-stack">
          <section className="panel panel-units">
            <div className="panel-heading">
              <h2>Units Panel</h2>
            </div>
            <UnitList />
          </section>

          <section className="panel panel-events">
            <div className="panel-heading">
              <h2>Event Feed</h2>
            </div>
            <EventFeed />
          </section>
        </div>
      </section>

      <section className="layout-bottom">
        <LegendPanel />

        <section className="panel panel-performance">
          <div className="panel-heading">
            <h2>Performance Panel</h2>
          </div>
          <PerformancePanel />
        </section>
      </section>
    </main>
  );
};
