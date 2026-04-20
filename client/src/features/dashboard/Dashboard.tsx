import { useMemo } from 'react';
import { unitsSelectors } from '../../entities/units/store';
import { MapCanvas } from '../map/MapCanvas';
import { UnitList } from '../unit-list/UnitList';
import { useAppSelector } from '../../store/hooks';

export const Dashboard = (): JSX.Element => {
  const units = useAppSelector(unitsSelectors.selectAll);
  const filters = useAppSelector((state) => state.filters);
  const events = useAppSelector((state) => state.eventsFeed.items);
  const kpis = useAppSelector((state) => state.kpis);
  const performance = useAppSelector((state) => state.performance);
  const connection = useAppSelector((state) => state.connection);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      if (filters.team !== 'all' && unit.team !== filters.team) {
        return false;
      }
      if (filters.zone !== 'all' && unit.zone !== filters.zone) {
        return false;
      }
      if (!filters.includeDestroyed && !unit.alive) {
        return false;
      }
      return true;
    });
  }, [filters.includeDestroyed, filters.team, filters.zone, units]);

  return (
    <main className="layout">
      <section className="panel metrics">
        <h1>Battle Dashboard</h1>
        <p>Connection: {connection.phase}</p>
        <p>Tick: {kpis.tickNumber}</p>
        <p>Alive: {kpis.data?.unitsAlive ?? 0}</p>
        <p>Destroyed: {kpis.data?.destroyedCount ?? 0}</p>
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
        <UnitList units={filteredUnits} />
      </section>

      <section className="panel list">
        <h2>Events Feed</h2>
        <div className="unit-list-scroll">
          {events.slice(0, 60).map((event) => (
            <div key={event.id} className="unit-row">
              <span>#{event.tickNumber}</span>
              <span>{event.type}</span>
              <span>{event.zone}</span>
              <span>{event.details}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
