'use client';
import React, { useEffect, useState } from 'react';
import { EVENTS } from '@/utils/constants';
import EventItems from './event-items';
import { Tag } from './tag';
import ShadowButton from './ShadowButton';

const RearrangeOrderPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [events, setEvents] = useState([
    { id: 1, name: 'A', icon: '🏢', flag: '🇮🇳' },
    { id: 2, name: 'B', icon: '🏛️', flag: '🇯🇵' },
    { id: 3, name: 'C', icon: '', flag: '' },
    { id: 4, name: 'D', icon: '🗼', flag: '🇨🇦' },
    { id: 5, name: 'E', icon: '🏢', flag: '🇦🇪' },
    { id: 6, name: 'F', icon: '🏢', flag: '🇮🇳' },
    { id: 7, name: 'G', icon: '🏛️', flag: '🇯🇵' },
    { id: 8, name: 'H', icon: '', flag: '' },
    { id: 9, name: 'I', icon: '🗼', flag: '🇨🇦' },
    { id: 10, name: 'J', icon: '🏢', flag: '🇦🇪' },
  ]);

  const recentlyAdded = ['London', 'FIL Bangalore', 'Funding the commons', 'San Francisco'];

  // Handle drag and drop reordering
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    const newEvents = [...events];
    const draggedEvent = newEvents[dragIndex];
    
    // Remove the dragged item
    newEvents.splice(dragIndex, 1);
    // Insert at the new position
    newEvents.splice(dropIndex, 0, draggedEvent);
    
    setEvents(newEvents);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };

  useEffect(() => {
    function handler(e: CustomEvent) {
      const loadingStatus = e.detail;
      if (loadingStatus) {
        console.log('Rearrange order popup triggered');
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }

    document.addEventListener(EVENTS.TRIGGER_REARRANGE_ORDER_POPUP, handler as EventListener);
    return () => {
      document.removeEventListener(EVENTS.TRIGGER_REARRANGE_ORDER_POPUP, handler as EventListener);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="rearrange-order-popup">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Add New Events / Locations</h2>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <img src="/icons/search-gray.svg" alt="search" className="search-icon" />
            <input type="text" placeholder="Search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="search-input" />
          </div>
        </div>

        {/* Recently Added */}
        <div className="recently-added-section">
          <h3 className="section-title">Recently Added Events & Locations</h3>
          <div className="tags-container">
            {recentlyAdded.map((item, index) => (
              <Tag key={index} value={`${item} +`} variant="secondary" />
            ))}
          </div>
        </div>

        {/* Rearrange Events */}
        <div className="rearrange-section">
          <h3 className="section-title-1">Rearrange Current & Upcoming Events</h3>
          <div className="events-grid">
            {events.map((event, index) => (
              <EventItems 
                key={event.id} 
                event={event} 
                originalIndex={index}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {/* <button className="cancel-btn" onClick={() => setIsOpen(false)}>
            Cancel
          </button> */}
          <ShadowButton buttonColor="#FFFFFF" shadowColor="#156FF7" buttonHeight="40px" buttonWidth="100px" textColor="#000000" onClick={() => setIsOpen(false)}>
            Cancel
          </ShadowButton>
          <ShadowButton buttonColor="#156FF7" shadowColor="#3DFEB1" buttonHeight="40px" buttonWidth="130px" onClick={() => setIsOpen(false)}>
            Save Changes
          </ShadowButton>
        </div>
      </div>
      <style jsx>{`
        .rearrange-order-popup {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .rearrange-order-popup-content {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .rearrange-order-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
        }

        .rearrange-order-popup-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #374151;
        }

        .rearrange-order-popup-body {
          padding: 1.5rem;
        }

        .rearrange-order-popup-body-item {
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 1rem;
          background: #f9fafb;
          cursor: move;
        }

        .rearrange-order-popup-body-item:last-child {
          margin-bottom: 0;
        }

        .rearrange-order-popup-body-item h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 500;
          color: #111827;
        }

        .rearrange-order-popup-body-item p {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .rearrange-order-popup-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
        }

        .cancel-button,
        .save-button {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid;
        }

        .cancel-button {
          background: white;
          border-color: #d1d5db;
          color: #374151;
        }

        .cancel-button:hover {
          background: #f9fafb;
        }

        .save-button {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .save-button:hover {
          background: #2563eb;
        }
        .modal-container {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          margin-bottom: 10px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #6b7280;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background-color: #f3f4f6;
          color: #374151;
        }

        .search-container {
          padding: 0 24px;
          margin-bottom: 20px;
        }

        .search-input-wrapper {
          position: relative;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
        }

        .search-input {
          width: 446px;
          padding: 12px 12px 12px 44px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }

        .recently-added-section {
          padding: 0 24px;
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 500;
          color: rgba(100, 116, 139, 1);
          line-height: 28px;
          margin: 0 0 10px 0;
        }
        .section-title-1 {
          font-size: 16px;
          font-weight: 600;
          color: rgba(15, 23, 42, 1);
          line-height: 28px;
          margin: 0 0 10px 0;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag {
          background-color: #f3f4f6;
          color: #374151;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tag-plus {
          color: #6b7280;
          font-weight: 500;
        }

        .rearrange-section {
          padding: 0 24px;
          // margin-bottom: 24px;
        }

        .events-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px;
        }

        .cancel-btn {
          padding: 10px 20px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .save-btn {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-btn:hover {
          background-color: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default RearrangeOrderPopup;
