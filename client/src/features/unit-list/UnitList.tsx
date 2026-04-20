import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Unit } from '../../entities/units/types';

interface UnitListProps {
  units: Unit[];
}

export const UnitList = ({ units }: UnitListProps): JSX.Element => {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: units.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 8
  });

  return (
    <div ref={parentRef} className="unit-list-scroll">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const unit = units[virtualRow.index];
          if (!unit) {
            return null;
          }

          return (
            <div
              key={unit.id}
              className="unit-row"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <span>{unit.id}</span>
              <span>{unit.team}</span>
              <span>HP: {unit.health}</span>
              <span>{unit.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
