import React from 'react';

interface EventItemsProps {
  event: any;
  originalIndex: number;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const EventItems = ({ event, originalIndex, onDragStart, onDragOver, onDrop, onDragEnd }: EventItemsProps) => {
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
          <span className="event-icon">{event.icon}</span>
          <span className="event-flag">{event.flag}</span>
          <span className="event-name">{event.name}</span>
        </div>
        <div className="event-actions">
          <button className="delete-btn">
            <img src="/icons/delete-red.svg" alt="delete" />
          </button>
          <button className="drag-handle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="12" r="1"></circle>
              <circle cx="9" cy="5" r="1"></circle>
              <circle cx="9" cy="19" r="1"></circle>
              <circle cx="15" cy="12" r="1"></circle>
              <circle cx="15" cy="5" r="1"></circle>
              <circle cx="15" cy="19" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>
      <style jsx>{`
        .events-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .events-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .event-item {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
          cursor: grab;
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
          padding: 10px 0;
        }

        .event-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .event-icon {
          font-size: 16px;
        }

        .event-flag {
          font-size: 16px;
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
          color: #9ca3af;
          cursor: grab;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .delete-btn:hover {
          background-color: #fef2f2;
          color: #dc2626;
        }

        .drag-handle:hover {
          background-color: #f3f4f6;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default EventItems;
