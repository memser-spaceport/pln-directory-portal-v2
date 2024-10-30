import { Tooltip } from '@/components/core/tooltip/tooltip';
import React from 'react';

interface EventSummaryProps {
  events: string[];
  maxVisibleEvents?: number;
}

const EventSummary: React.FC<EventSummaryProps> = ({
  events,
  maxVisibleEvents = 1, // Default number of visible events before truncation
}) => {
  const visibleEvents = events.slice(0, maxVisibleEvents);
  const hiddenEventCount = events.length - visibleEvents.length;
  const remainingEvents = events.slice(maxVisibleEvents);

  return (
    <>
      <div className="eventSummaryContainer">
        <div className="eventsContainer">
          <Tooltip asChild align="start" content={<div className="eventName">{visibleEvents.join(', ')}</div>} trigger={<div className="eventsList">{visibleEvents.join(', ')}</div>}></Tooltip>
          {hiddenEventCount > 0 && (
            <Tooltip
              asChild
              align="start"
              content={
                <div className="allEvents">
                  {remainingEvents.map((event, index) => (
                    <div className="eventName" key={index}>
                      {event}
                      {index < remainingEvents.length - 1 ? ',' : ''}
                    </div>
                  ))}
                </div>
              }
              trigger={<button className="hiddenCount">+{hiddenEventCount}</button>}
            />
          )}
        </div>
      </div>
      <style jsx>{`
        .eventSummaryContainer {
          display: flex;
          align-items: center;
          border-radius: 4px;
          height: inherit;
          border: 0.5px solid #cbd5e1;
          background-color: #ffffff;
          width: fit-content;
        }

        .dateRange {
          font-weight: bold;
          margin-right: 8px;
        }

        .eventsContainer {
          display: flex;
          align-items: center;
          overflow: hidden;
          height: inherit;
        }

        .eventsList {
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 100px;
          padding: 0px 6px;
          font-size: 11.5px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
        }

        .allEvents {
          display: flex;
          flex-direction: column;
        }

        .eventName {
          font-size: 11.5px;
          font-weight: 400;
          line-height: 20px;
        }

        .hiddenCount {
          font-weight: bold;
          border-left: 1px solid #cbd5e1;
          height: inherit;
          display: inline-flex;
          align-items: center;
          padding: 0px 6px;
          color: #0f172a;
          font-size: 11.5px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          background-color: transparent;
        }
      `}</style>
    </>
  );
};

export default EventSummary;
