'use client';

import { useState, useMemo, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import Image from 'next/image';
import { CalendarPlusIcon, CaretUpIcon, CaretDownIcon, CheckIcon, SearchIcon, XCircleIcon } from '../icons';
import { EventData, EventRole, EventRoleSelection, IrlGatheringFormData } from '../types';
import s from '../IrlGatheringModal.module.scss';

const AVAILABLE_ROLES: EventRole[] = ['Attendee', 'Speaker', 'Host'];

interface EventsSectionProps {
  events: EventData[];
  locationName?: string;
  defaultExpanded?: boolean;
}

function formatEventDate(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function EventsSection({ events, locationName = '', defaultExpanded = true }: EventsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchQuery, setSearchQuery] = useState('');
  const { watch, setValue } = useFormContext<IrlGatheringFormData>();
  const selectedEventUids = watch('selectedEventUids') || [];
  const eventRoles = watch('eventRoles') || [];

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter((event) => event.name.toLowerCase().includes(query));
  }, [events, searchQuery]);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const getEventRoles = useCallback(
    (eventUid: string): EventRole[] => {
      const eventRole = eventRoles.find((er) => er.eventUid === eventUid);
      return eventRole?.roles || [];
    },
    [eventRoles],
  );

  const handleRoleToggle = useCallback(
    (eventUid: string, role: EventRole, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent event card click

      const currentEventRoles = eventRoles.find((er) => er.eventUid === eventUid);
      const currentRoles = currentEventRoles?.roles || [];

      let newRoles: EventRole[];
      if (currentRoles.includes(role)) {
        newRoles = currentRoles.filter((r) => r !== role);
      } else {
        newRoles = [...currentRoles, role];
      }

      const updatedEventRoles = eventRoles.filter((er) => er.eventUid !== eventUid);
      if (newRoles.length > 0) {
        updatedEventRoles.push({ eventUid, roles: newRoles });
      }

      setValue('eventRoles', updatedEventRoles);
    },
    [eventRoles, setValue],
  );

  const handleEventToggle = (eventUid: string) => {
    const isSelected = selectedEventUids.includes(eventUid);
    if (isSelected) {
      setValue(
        'selectedEventUids',
        selectedEventUids.filter((uid) => uid !== eventUid),
      );
      // Also remove roles for this event
      setValue(
        'eventRoles',
        eventRoles.filter((er) => er.eventUid !== eventUid),
      );
    } else {
      setValue('selectedEventUids', [...selectedEventUids, eventUid]);
      // Initialize with Attendee role by default
      setValue('eventRoles', [...eventRoles, { eventUid, roles: ['Attendee'] as EventRole[] }]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredUids = filteredEvents.map((e) => e.uid);
    const allSelected = allFilteredUids.every((uid) => selectedEventUids.includes(uid));

    if (allSelected) {
      // Deselect all filtered events
      setValue(
        'selectedEventUids',
        selectedEventUids.filter((uid) => !allFilteredUids.includes(uid)),
      );
      // Remove roles for deselected events
      setValue(
        'eventRoles',
        eventRoles.filter((er) => !allFilteredUids.includes(er.eventUid)),
      );
    } else {
      // Select all filtered events (merge with existing selections)
      const newSelection = [...new Set([...selectedEventUids, ...allFilteredUids])];
      setValue('selectedEventUids', newSelection);
      // Add default Attendee role for newly selected events
      const existingEventUids = eventRoles.map((er) => er.eventUid);
      const newEventRoles: EventRoleSelection[] = allFilteredUids
        .filter((uid) => !existingEventUids.includes(uid))
        .map((uid) => ({ eventUid: uid, roles: ['Attendee'] as EventRole[] }));
      setValue('eventRoles', [...eventRoles, ...newEventRoles]);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (events.length === 0) {
    return null;
  }

  const selectedCount = selectedEventUids.length;

  return (
    <div className={s.accordionContainer}>
      <button type="button" className={s.accordionHeader} onClick={toggleExpanded}>
        <div className={s.accordionHeaderContent}>
          <span className={s.accordionIcon}>
            <CalendarPlusIcon />
          </span>
          <span className={s.accordionTitle}>Events</span>
        </div>
        <span className={s.accordionCaret}>{isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}</span>
      </button>

      {isExpanded && (
        <div className={s.eventsExpandedContent}>
          {/* Description */}
          <div className={s.eventsDescription}>
            <p className={s.eventsDescriptionTitle}>
              Which events are you planning to attend{locationName ? ` in ${locationName}` : ''}?
            </p>
            <p className={s.eventsDescriptionSubtitle}>
              This helps others know where they can meet you during the week. You can update this later.
            </p>
          </div>

          {/* Search Input */}
          <div className={s.eventsSearchContainer}>
            <span className={s.eventsSearchIcon}>
              <SearchIcon />
            </span>
            <input
              type="text"
              className={s.eventsSearchInput}
              placeholder="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={s.eventsSearchClear}
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <XCircleIcon />
              </button>
            )}
          </div>

          {/* Select All & Counter */}
          <div className={s.eventsToolbar}>
            <button type="button" className={s.eventsSelectAllBadge} onClick={handleSelectAll}>
              Select all{locationName ? ` ${locationName}` : ''} events
            </button>
            <span className={s.eventsSelectedCount}>{selectedCount} selected</span>
          </div>

          {/* Events List */}
          <div className={s.eventsListContainer}>
            {filteredEvents.map((event) => {
              const isSelected = selectedEventUids.includes(event.uid);
              const selectedRoles = getEventRoles(event.uid);
              return (
                <div
                  key={event.uid}
                  className={`${s.eventListItem} ${isSelected ? s.eventListItemSelected : ''}`}
                  onClick={() => handleEventToggle(event.uid)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleEventToggle(event.uid);
                    }
                  }}
                >
                  <div className={`${s.eventCheckbox} ${isSelected ? s.eventCheckboxChecked : ''}`}>
                    {isSelected && <CheckIcon />}
                  </div>
                  <div className={s.eventListLogo}>
                    {event.logoUrl ? (
                      <Image src={event.logoUrl} alt={event.name} width={40} height={40} />
                    ) : (
                      <div className={s.eventLogoPlaceholder}>
                        <CalendarPlusIcon />
                      </div>
                    )}
                  </div>
                  <div className={s.eventListInfo}>
                    <span className={s.eventListName}>{event.name}</span>
                    {isSelected && event.description && (
                      <span className={s.eventListDescription}>{event.description}</span>
                    )}
                    {!isSelected && (
                      <span className={s.eventListMeta}>
                        {formatEventDate(event.startDate, event.endDate)} · {event.attendeeCount} attending
                      </span>
                    )}
                    {isSelected && (
                      <div className={s.eventRoleSelector}>
                        <span className={s.eventRoleLabel}>Role:</span>
                        <div className={s.eventRoleBadges}>
                          {AVAILABLE_ROLES.map((role) => {
                            const isRoleSelected = selectedRoles.includes(role);
                            return (
                              <button
                                key={role}
                                type="button"
                                className={`${s.eventRoleBadge} ${isRoleSelected ? s.eventRoleBadgeSelected : ''}`}
                                onClick={(e) => handleRoleToggle(event.uid, role, e)}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredEvents.length === 0 && (
              <div className={s.eventsEmptyState}>
                No events found matching <b>{searchQuery}</b>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
