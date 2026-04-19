import { useMemo } from 'react';
import { unitsSelectors } from '../../entities/units/store';
import { MapCanvas } from '../map/MapCanvas';
import { UnitList } from '../unit-list/UnitList';
import { useAppSelector } from '../../store/hooks';

export const Dashboard = (): JSX.Element => {
  // TODO: split selectors by feature to reduce recomputation under heavy update rates.
  const units = useAppSelector(unitsSelectors.selectAll);

  const metrics = useMemo(() => {
    let red = 0;
    let blue = 0;
    let destroyed = 0;

    for (const unit of units) {
      if (unit.team === 'red') {
        red += 1;
      } else {
        blue += 1;
      }

      if (unit.status === 'destroyed') {
        destroyed += 1;
      }
    }

    return {
      total: units.length,
      red,
      blue,
      destroyed
    };
  }, [units]);

  return (
    <main className="layout">
      <section className="panel metrics">
        <h1>Battlefield Dashboard</h1>
        <p>Total units: {metrics.total}</p>
        <p>Red: {metrics.red}</p>
        <p>Blue: {metrics.blue}</p>
        <p>Destroyed: {metrics.destroyed}</p>
      </section>

      <section className="panel map">
        <h2>Map</h2>
        <MapCanvas units={units} width={900} height={450} />
      </section>

      <section className="panel list">
        <h2>Units</h2>
        <UnitList units={units} />
      </section>
    </main>
  );
};
