import { EventFeed } from '../events/EventFeed';
import { KpiCards } from '../kpis/KpiCards';
import { MapCanvas } from '../map/MapCanvas';
import { PerformancePanel } from '../performance/PerformancePanel';
import { UnitList } from '../unit-list/UnitList';

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
        <section className="panel panel-legend">
          <div className="panel-heading">
            <h2>Legend / Filters</h2>
          </div>
          <div className="legend-list">
            <label className="legend-item">
              <span className="sketch-box sketch-box-red" />
              <span>Alpha Team</span>
            </label>
            <label className="legend-item">
              <span className="sketch-box sketch-box-blue" />
              <span>Bravo Team</span>
            </label>
            <label className="legend-item">
              <span className="sketch-box sketch-box-zone" />
              <span>Control Zone</span>
            </label>
          </div>
        </section>

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
