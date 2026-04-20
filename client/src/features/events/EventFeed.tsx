import { useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';

export const EventFeed = (): JSX.Element => {
  const events = useAppSelector((state) => state.eventsFeed.items);
  const visibleEvents = useMemo(() => events.slice(0, 60), [events]);

  return (
    <div className="event-feed">
      <div className="event-feed-summary">
        <span>Recent Events</span>
        <span>{events.length} rows</span>
      </div>

      <div className="unit-list-scroll event-feed-scroll">
        {visibleEvents.length === 0 ? (
          <div className="empty-state">No recent combat events.</div>
        ) : (
          visibleEvents.map((event) => (
            <div key={event.id} className={`unit-row event-row-grid event-${event.type}`}>
              <span>#{event.tickNumber}</span>
              <span>{event.type}</span>
              <span>{event.zone}</span>
              <span>{event.details}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
