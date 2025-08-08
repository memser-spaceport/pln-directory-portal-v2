import React from 'react';

interface EventItemsProps {
  event: any;
  originalIndex: number;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDelete: () => void;
}

const EventItems = ({ event, originalIndex, onDragStart, onDragOver, onDrop, onDragEnd, onDelete }: EventItemsProps) => {
  return (
    <div 
      className="event-item"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="event-number">{originalIndex + 1}</div>
      <div className="event-content">
        <div className="event-info">
          {
            event.category === 'location' && (
              <>
                {
                  event.icon && <img src={event.icon} alt="event-icon" className="event-icon" />
                }
                <img src={event.flag ? event.flag : '/images/irl/defaultFlag.svg'} alt="event-flag" className="event-flag" />
              </>
            )
          }
          <span className="event-name">{event.category === 'location' ? event.location?.charAt(0).toUpperCase() + event.location?.slice(1) : event.name?.charAt(0).toUpperCase() + event.name?.slice(1)}</span>
        </div>
        <div className="event-actions">
          <button className="delete-btn" onClick={onDelete}>
            <img src="/icons/delete-red.svg" alt="delete" />
          </button>
          <button className="drag-handle">
            <img src="/icons/drag-event-icon.svg" alt="drag-handle" />
          </button>
        </div>
      </div>
      <style jsx>{`
        .event-item {
          display: flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
        }

        .event-item:active {
          cursor: grabbing;
        }

        .event-item:hover {
          border-color: #d1d5db;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .event-number {
          background-color: #dbeafe;
          color: #1d4ed8;
          border-top-left-radius: 7px;
          border-bottom-left-radius: 7px;
          width: 40px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .event-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 10px 10px;
        }

        .event-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .event-icon {
          width: 40px;
          height: 40px;
        }

        .event-flag {
          width: 20px;
          height: 20px;
        }

        .event-name {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        .event-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .delete-btn,
        .drag-handle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #ef4444;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .drag-handle {
          cursor: grab;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .delete-btn:hover {
          background-color: #fef2f2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default EventItems;
