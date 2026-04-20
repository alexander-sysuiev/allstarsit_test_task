import type { Zone } from '../../entities/units/types';
import { useAppSelector } from '../../store/hooks';

const ZONE_ORDER: Zone[] = ['north-west', 'north-east', 'south-west', 'south-east'];

export const KpiCards = (): JSX.Element => {
  const kpis = useAppSelector((state) => state.kpis);

  const zoneSummary = ZONE_ORDER.map((zone) => {
    const owner = kpis.data?.zoneControl[zone] ?? 'neutral';
    return `${zone.replace('-', ' ')}: ${owner}`;
  }).join(' | ');

  return (
    <section className="panel kpi-strip">
      <article className="kpi-strip-item">
        <div className="kpi-inline">
          <p className="kpi-inline-text">Units Alive:</p>
          <p className="kpi-inline-text">{kpis.data?.unitsAlive ?? 0}</p>
        </div>
      </article>

      <article className="kpi-strip-item">
        <div className="kpi-inline">
          <p className="kpi-inline-text">Units Destroyed:</p>
          <p className="kpi-inline-text">{kpis.data?.destroyedCount ?? 0}</p>
        </div>
      </article>

      <article className="kpi-strip-item">
        <div className="kpi-inline kpi-inline-zone">
          <p className="kpi-inline-text">Zone Control:</p>
          <p className="kpi-inline-text kpi-inline-zone-value">{zoneSummary}</p>
        </div>
      </article>
    </section>
  );
};
