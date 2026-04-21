import { memo, useDeferredValue, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { unitsSelectors } from '../entities/units/store';
import type { Unit, UnitStatus } from '../entities/units/types';
import { useAppSelector } from '../store/hooks';
import { filterUnitsForList, normalizeHealthRange } from '../utils/unitListFilters';

const STATUS_OPTIONS: Array<UnitStatus | 'all'> = ['all', 'idle', 'moving', 'attacking', 'healing', 'dead'];

const UnitRow = memo(({ unit }: { unit: Unit }): JSX.Element => {
  return (
    <div className="unit-row unit-row-grid">
      <span className="unit-name">{unit.name}</span>
      <span>{unit.team}</span>
      <span>{unit.status}</span>
      <span>{unit.health}</span>
      <span>
        {unit.zone} ({Math.round(unit.x)}, {Math.round(unit.y)})
      </span>
    </div>
  );
});

export const UnitList = (): JSX.Element => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const units = useAppSelector(unitsSelectors.selectAll);
  const battlefieldFilters = useAppSelector((state) => state.filters);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UnitStatus | 'all'>('all');
  const [minHealth, setMinHealth] = useState('0');
  const [maxHealth, setMaxHealth] = useState('100');

  const deferredSearch = useDeferredValue(search);
  const normalizedQuery = deferredSearch.trim().toLowerCase();
  const { minHealth: normalizedMinHealth, maxHealth: normalizedMaxHealth } = normalizeHealthRange(
    minHealth,
    maxHealth
  );

  const filteredUnits = useMemo(() => {
    return filterUnitsForList(units, battlefieldFilters, {
      query: normalizedQuery,
      status,
      minHealth: normalizedMinHealth,
      maxHealth: normalizedMaxHealth
    });
  }, [
    battlefieldFilters,
    normalizedMaxHealth,
    normalizedMinHealth,
    normalizedQuery,
    status,
    units
  ]);

  const rowVirtualizer = useVirtualizer({
    count: filteredUnits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10
  });

  return (
    <section className="panel panel-units">
      <div className="panel-heading">
        <h2>Units Panel</h2>
      </div>
      <div className="unit-panel">
        <div className="unit-panel-controls">
          <label className="unit-panel-field">
            <span>Name</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search unit name"
            />
          </label>

          <label className="unit-panel-field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as UnitStatus | 'all')}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="unit-panel-field">
            <span>Min HP</span>
            <input
              type="number"
              min="0"
              value={minHealth}
              onChange={(event) => setMinHealth(event.target.value)}
            />
          </label>

          <label className="unit-panel-field">
            <span>Max HP</span>
            <input
              type="number"
              min="0"
              value={maxHealth}
              onChange={(event) => setMaxHealth(event.target.value)}
            />
          </label>
        </div>

        <div className="unit-panel-summary">
          <span>{filteredUnits.length} units</span>
        </div>

        <div className="unit-list-head unit-row-grid">
          <span>Name</span>
          <span>Team</span>
          <span>Status</span>
          <span>HP</span>
          <span>Zone / Coords</span>
        </div>

        <div ref={parentRef} className="unit-list-scroll">
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const unit = filteredUnits[virtualRow.index];
              if (!unit) {
                return null;
              }

              return (
                <div
                  key={unit.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  <UnitRow unit={unit} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
