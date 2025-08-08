'use client';
import React, { useEffect, useState } from 'react';
import { EVENTS } from '@/utils/constants';
import EventItems from './event-items';
import { Tag } from './tag';
import ShadowButton from './ShadowButton';
import { getAggregatedEventsData, updatePriority } from '@/services/events.service';
import { formatBasedOnAggregatedPriority, formatFeaturedData } from '@/utils/home.utils';
import { toast } from 'react-toastify';

const RearrangeOrderPopup = (props: any) => {
  const authToken = props?.authToken || '';
  const [isOpen, setIsOpen] = useState(false);
  const [eventLocationSuggestions, setEventLocationSuggestions] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [eventList, setEventList] = useState<any[]>([]);
  const [originalOrder, setOriginalOrder] = useState<any[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<any[]>([]);
  const [priorityChanges, setPriorityChanges] = useState<{
    events: Array<{ uid: string; aggregatedPriority: number; isAggregated: boolean }>;
    locations: Array<{ uid: string; aggregatedPriority: number; isAggregated: boolean }>;
  }>({
    events: [],
    locations: [],
  });
  const [deletedItems, setDeletedItems] = useState<{
    events: Array<{ uid: string; aggregatedPriority: null; isAggregated: boolean }>;
    locations: Array<{ uid: string; aggregatedPriority: null; isAggregated: boolean }>;
  }>({
    events: [],
    locations: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const totalEvents = eventList.length;
  const isEven = totalEvents % 2 === 0;
  const leftColumnCount = isEven ? totalEvents / 2 : Math.ceil(totalEvents / 2);

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

    const newEvents = [...eventList];
    const draggedEvent = newEvents[dragIndex];
    newEvents.splice(dragIndex, 1);
    newEvents.splice(dropIndex, 0, draggedEvent);
    setEventList(newEvents);
    const newPriorityChanges = calculatePriorityChanges(newEvents);
    setPriorityChanges(newPriorityChanges);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };

  const handleDeleteItem = (index: number) => {
    const itemToDelete = eventList[index];
    const itemKey = itemToDelete.uid || itemToDelete.id;
    const newEventList = eventList.filter((_, i) => i !== index);
    setEventList(newEventList);

    setDeletedItems((prevDeletedItems) => {
      const newDeletedItems = { ...prevDeletedItems };
      if (itemToDelete.category === 'event') {
        newDeletedItems.events.push({
          uid: itemKey,
          aggregatedPriority: null,
          isAggregated: false,
        });
      } else if (itemToDelete.category === 'location') {
        newDeletedItems.locations.push({
          uid: itemKey,
          aggregatedPriority: null,
          isAggregated: false,
        });
      }
      return newDeletedItems;
    });

    const newPriorityChanges = calculatePriorityChanges(newEventList);
    setPriorityChanges(newPriorityChanges);
  };

  const calculatePriorityChanges = (currentList: any[]) => {
    const events: Array<{ uid: string; aggregatedPriority: number; isAggregated: boolean }> = [];
    const locations: Array<{ uid: string; aggregatedPriority: number; isAggregated: boolean }> = [];

    const originalPositions = new Map();
    originalOrder.forEach((item, index) => {
      const key = item.uid || item.id;
      originalPositions.set(key, index);
    });

    currentList.forEach((item, currentIndex) => {
      const itemKey = item.uid || item.id;
      const originalIndex = originalPositions.get(itemKey);

      const isNewItem = originalIndex === undefined;
      const hasChangedPosition = originalIndex !== currentIndex;

      if (isNewItem || hasChangedPosition) {
        const newPriority = currentIndex + 1;

        if (item.category === 'event') {
          events.push({
            uid: itemKey,
            aggregatedPriority: newPriority,
            isAggregated: true,
          });
        } else if (item.category === 'location') {
          locations.push({
            uid: itemKey,
            aggregatedPriority: newPriority,
            isAggregated: true,
          });
        }
      }
    });

    return { events, locations };
  };

  const handleSuggestionSelect = (suggestion: any) => {
    const newEventList = [suggestion, ...eventList];
    setEventList(newEventList);

    const newPriorityChanges = calculatePriorityChanges(newEventList);
    setPriorityChanges(newPriorityChanges);

    setEventLocationSuggestions([]);
    setSearchValue('');
  };

  const handleTagClick = (item: any) => {
    const newEventList = [item, ...eventList];
    setEventList(newEventList);

    const newPriorityChanges = calculatePriorityChanges(newEventList);
    setPriorityChanges(newPriorityChanges);
  };

  const getEventLocationSuggestions = async (searchValue: string) => {
    try {
      let aggregatedEventsResponse = await getAggregatedEventsData(authToken, searchValue, undefined, false);
      const aggregatedEventsData = formatFeaturedData(aggregatedEventsResponse?.data);
      setEventLocationSuggestions(aggregatedEventsData);
    } catch (error) {
      console.error('Error fetching event location suggestions:', error);
      return { error: { message: 'Failed to fetch event location suggestions' } };
    }
  };

  const handleSearchLocation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearchValue(searchValue);
    if (searchValue.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        getEventLocationSuggestions(searchValue);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchValue('');
      setEventLocationSuggestions([]);
    }
  };

  useEffect(() => {
    async function handler(e: CustomEvent) {
      const loadingStatus = e.detail;
      if (loadingStatus) {
        setIsOpen(true);
        setIsLoading(true);
        try {
          const [aggregatedEventsResponse, recentlyAddedResponse] = await Promise.all([
            getAggregatedEventsData(authToken, undefined, 'aggregatedPriority', true),
            getAggregatedEventsData(authToken, undefined, '-createdAt', false),
          ]);

          const aggregatedEventsData = formatBasedOnAggregatedPriority(aggregatedEventsResponse?.data);
          setEventList(aggregatedEventsData);
          setOriginalOrder(aggregatedEventsData);
          setRecentlyAdded(recentlyAddedResponse.data);
        } catch (error) {
          console.error('Error fetching aggregated events data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsOpen(false);
        setIsLoading(false);
      }
    }

    document.addEventListener(EVENTS.TRIGGER_REARRANGE_ORDER_POPUP, handler as unknown as EventListener);

    return () => {
      document.removeEventListener(EVENTS.TRIGGER_REARRANGE_ORDER_POPUP, handler as unknown as EventListener);
    };
  }, [authToken]);

  useEffect(() => {
    if (eventList.length > 0 && originalOrder.length === eventList.length) {
      setPriorityChanges({ events: [], locations: [] });
      setDeletedItems({ events: [], locations: [] });
    }
  }, [eventList.length, originalOrder.length]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const finalPriorityChanges = calculatePriorityChanges(eventList);
      const combinedChanges = {
        events: [...deletedItems.events, ...finalPriorityChanges.events],
        locations: [...deletedItems.locations, ...finalPriorityChanges.locations],
      };
      const result = await updatePriority(authToken, combinedChanges);

      if (result.error) {
        console.error('Error saving changes:', result.error);
        return;
      }

      setOriginalOrder([...eventList]);
      setPriorityChanges({ events: [], locations: [] });
      setDeletedItems({ events: [], locations: [] });
      setIsOpen(false);   
      toast.success('Changes saved successfully');  
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    const hasPriorityChanges = priorityChanges.events.length > 0 || priorityChanges.locations.length > 0;
    const hasDeletedItems = deletedItems.events.length > 0 || deletedItems.locations.length > 0;
    const hasListChanges =
      eventList.length !== originalOrder.length ||
      eventList.some((item, index) => {
        const originalItem = originalOrder[index];
        return !originalItem || item.uid !== originalItem.uid || item.id !== originalItem.id;
      });

    const hasChangesResult = hasPriorityChanges || hasDeletedItems || hasListChanges;
    return hasChangesResult;
  };

  if (!isOpen) return null;

  return (
    <div className="rearrange__order" onClick={handleClose}>
      <div className="rearrange__order__container" onClick={(e) => e.stopPropagation()}>
        <div className="rearrange__order__container__header">
          <h2 className="header__content">Add New Events / Locations</h2>
          <img src="/icons/close-gray.svg" alt="close" className="header__content-closeIcon" width={20} height={20} onClick={() => setIsOpen(false)} />
        </div>

        <div className="rearrange__order__container__search">
          <div className="search__wrapper">
            <img src="/icons/search-gray.svg" alt="search" className="search__wrapper-searcIcon" />
            <input type="text" placeholder="Search" value={searchValue} onChange={(e) => handleSearchLocation(e)} className="search__wrapper-searchInput" />
            {searchValue.trim().length > 0 && (
              <div className="search__loaction">
                {eventLocationSuggestions.length === 0 && <p className="search__loaction__suggestion">No suggestions found</p>}
                {eventLocationSuggestions.length > 0 &&
                  eventLocationSuggestions.map((suggestion: any) => (
                    <div key={suggestion.place_id} className="search__loaction__suggestion" onClick={() => handleSuggestionSelect(suggestion)}>
                      <div className="search__loaction__suggestion__content">
                        <img src={suggestion.category === 'event' ? '/icons/category-event.svg' : '/icons/category-location.svg'} alt="suggestion" className="suggestion-image" />
                        <p>{suggestion.name?.charAt(0).toUpperCase() + suggestion.name?.slice(1) || suggestion.location?.charAt(0).toUpperCase() + suggestion.location?.slice(1)}</p>
                      </div>
                      <img src="/icons/add-blue.svg" alt="arrow-right" className="arrow-right" />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="rearrange__order__container__recentlyAdded">
          <h3 className="recentlyAdded__title">Recently Added Events & Locations</h3>
          <div className="recentlyAdded__tags">
            {isLoading ? (
              <p>Loading recently added items...</p>
            ) : recentlyAdded.length === 0 ? (
              <p>No recently added items</p>
            ) : (
              recentlyAdded
                .slice(0, 4)
                .map((item, index) => (
                  <div key={index} onClick={() => handleTagClick(item)} style={{ cursor: 'pointer' }}>
                    <Tag value={`${item.name?.charAt(0).toUpperCase() + item.name?.slice(1) || item.location?.charAt(0).toUpperCase() + item.location?.slice(1)} +`} variant="secondary" />
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="rearrange__order__container__rearrange">
          {isLoading ? (
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <p>Loading events and locations...</p>
            </div>
          ) : eventList.length === 0 ? (
            <div className="no-events-message">
              <p>There is no events and location</p>
            </div>
          ) : (
            <>
              <h3 className="recentlyAdded__title-1">Rearrange Current & Upcoming Events</h3>
              <div
                className="events__grid"
                style={{
                  gridTemplateRows: `repeat(${leftColumnCount}, auto)`,
                }}
              >
                {eventList.map((event: any, index: number) => (
                  <EventItems
                    key={event.id}
                    event={event}
                    originalIndex={index}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onDelete={() => handleDeleteItem(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <ShadowButton buttonColor="#FFFFFF" shadowColor="#156FF7" buttonHeight="40px" buttonWidth="100px" textColor="#000000" onClick={() => setIsOpen(false)}>
            Cancel
          </ShadowButton>
          {hasChanges() ? (
            <ShadowButton buttonColor="#156FF7" shadowColor="#3DFEB1" buttonHeight="40px" buttonWidth="130px" onClick={handleSaveChanges}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </ShadowButton>
          ) : (
            <ShadowButton buttonColor="#E5E7EB" shadowColor="#CBD5E1" buttonHeight="40px" buttonWidth="130px" textColor="#6B7280" disabled={true}>
              No changes
            </ShadowButton>
          )}
        </div>
      </div>
      <style jsx>{`
        .rearrange__order {
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

        .search__loaction__suggestion__content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .search__loaction {
          position: absolute;
          width: 100%;
          margin-top: 6px;
          max-height: 200px;
          overflow-y: auto;
          background: white;
          border-top: none;
          border-radius: 6px;
          z-index: 4;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.16);
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
        .rearrange__order__container {
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

        .rearrange__order__container__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          margin-bottom: 10px;
        }

        .header__content {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .search__loaction__suggestion {
          padding: 12px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .search__loaction__suggestion:hover {
          background-color: #f5f7fa;
        }

        .search__loaction__suggestion .arrow-right {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }

        @media (max-width: 768px) {
          .search__loaction__suggestion {
            padding: 10px 12px;
            font-size: 16px;
          }

          .search__loaction__suggestion .arrow-right {
            width: 18px;
            height: 18px;
          }
        }

        @media (max-width: 480px) {
          .search__loaction__suggestion {
            padding: 12px 16px;
            font-size: 16px;
          }

          .search__loaction__suggestion .arrow-right {
            width: 20px;
            height: 20px;
          }
        }
        .header__content-closeIcon {
          background: none;
          border: none;
          cursor: pointer;
        }

        .rearrange__order__container__search {
          padding: 0 24px;
          margin-bottom: 20px;
        }

        .search__wrapper {
          position: relative;
          width: 446px;
        }

        .search__wrapper-searcIcon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
        }

        .search__wrapper-searchInput {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }

        .rearrange__order__container__recentlyAdded {
          padding: 0 24px;
          margin-bottom: 32px;
        }

        .recentlyAdded__title {
          font-size: 14px;
          font-weight: 500;
          color: rgba(100, 116, 139, 1);
          line-height: 28px;
          margin: 0 0 10px 0;
        }
        .recentlyAdded__title-1 {
          font-size: 16px;
          font-weight: 600;
          color: rgba(15, 23, 42, 1);
          line-height: 28px;
          margin: 0 0 10px 0;
        }

        .recentlyAdded__tags {
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

        .rearrange__order__container__rearrange {
          padding: 0 24px;
        }

        .events__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-auto-flow: column;
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
        .no-events-message {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px dashed #d1d5db;
          margin: 1rem 0;
        }
        .loading-message {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .loading-spinner {
          border: 4px solid #f3f3f3; /* Light grey */
          border-top: 4px solid #3498db; /* Blue */
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .tags-container p {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
          padding: 8px 0;
        }
      `}</style>
    </div>
  );
};

export default RearrangeOrderPopup;
