import type { Zone } from '../../entities/units/types';
import { useAppSelector } from '../../store/hooks';

const ZONE_ORDER: Zone[] = ['north-west', 'north-east', 'south-west', 'south-east'];

export const KpiCards = (): JSX.Element => {
  const connection = useAppSelector((state) => state.connection);
  const kpis = useAppSelector((state) => state.kpis);

  return (
    <section className="kpi-grid">
      <article className="panel kpi-card">
        <p className="kpi-label">Units Alive</p>
        <p className="kpi-value">{kpis.data?.unitsAlive ?? 0}</p>
        <p className="kpi-meta">Live total at tick {kpis.tickNumber}</p>
      </article>

      <article className="panel kpi-card">
        <p className="kpi-label">Destroyed</p>
        <p className="kpi-value">{kpis.data?.destroyedCount ?? 0}</p>
        <p className="kpi-meta">Connection: {connection.phase}</p>
      </article>

      <article className="panel kpi-card kpi-card-wide">
        <p className="kpi-label">Zone Control</p>
        <div className="zone-control-grid">
          {ZONE_ORDER.map((zone) => {
            const owner = kpis.data?.zoneControl[zone] ?? 'neutral';

            return (
              <div key={zone} className={`zone-chip zone-${owner}`}>
                <span>{zone}</span>
                <strong>{owner}</strong>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
};
