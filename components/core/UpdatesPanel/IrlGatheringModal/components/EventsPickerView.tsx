'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { format, toZonedTime } from 'date-fns-tz';
import { CalendarPlusIcon, CheckIcon, SearchIcon, XCircleIcon } from '../icons';
import { EventData, EventRole, EventRoleSelection } from '../types';
import s from '../IrlGatheringModal.module.scss';

const AVAILABLE_ROLES: EventRole[] = ['Attendee', 'Speaker', 'Host', 'Sponsor'];

interface EventsPickerViewProps {
  planningQuestion: string;
  locationName: string;
  timezone: string;
  events: EventData[];
  initialSelectedEventUids: string[];
  initialEventRoles: EventRoleSelection[];
  onCancel: () => void;
  onApply: (selectedEventUids: string[], eventRoles: EventRoleSelection[]) => void;
}

function parseAsLocationTimezone(dateString: string, timezone: string): Date {
  const date = new Date(dateString);
  const zonedDate = toZonedTime(date, timezone);
  return zonedDate;
}

function formatEventDate(startDate: string, endDate: string, timezone: string): string {
  const start = parseAsLocationTimezone(startDate, timezone);
  const end = parseAsLocationTimezone(endDate, timezone);
  const formatDate = (date: Date) => format(date, 'MMM d', { timeZone: timezone });

  if (start.getTime() === end.getTime()) {
    return formatDate(start);
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatDateGroupHeader(startDate: string, timezone: string): string {
  const start = parseAsLocationTimezone(startDate, timezone);
  return format(start, 'MMM d, yyyy', { timeZone: timezone });
}

function getDateKey(dateString: string, timezone: string): string {
  const date = parseAsLocationTimezone(dateString, timezone);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface EventGroup {
  dateKey: string;
  dateLabel: string;
  events: EventData[];
}

export function EventsPickerView({
  planningQuestion,
  locationName,
  timezone,
  events,
  initialSelectedEventUids,
  initialEventRoles,
  onCancel,
  onApply,
}: EventsPickerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventUids, setSelectedEventUids] = useState<string[]>(initialSelectedEventUids);

  // Normalize initial roles to ensure Attendee is always included
  const [eventRoles, setEventRoles] = useState<EventRoleSelection[]>(() =>
    initialEventRoles.map((er) => ({
      eventUid: er.eventUid,
      roles: er.roles.includes('Attendee') ? er.roles : (['Attendee', ...er.roles] as EventRole[]),
    })),
  );

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter((event) => event.name.toLowerCase().includes(query));
  }, [events, searchQuery]);

  // Group events by start date
  const groupedEvents = useMemo((): EventGroup[] => {
    const groups: Map<string, EventData[]> = new Map();

    filteredEvents.forEach((event) => {
      const dateKey = getDateKey(event.startDate, timezone);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    });

    // Sort groups by date and convert to array
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, evts]) => ({
        dateKey,
        dateLabel: formatDateGroupHeader(evts[0].startDate, timezone),
        events: evts,
      }));
  }, [filteredEvents, timezone]);

  const getEventRoles = useCallback(
    (eventUid: string): EventRole[] => {
      const eventRole = eventRoles.find((er) => er.eventUid === eventUid);
      return eventRole?.roles || [];
    },
    [eventRoles],
  );

  const handleRoleToggle = useCallback(
    (eventUid: string, role: EventRole, e: React.MouseEvent) => {
      e.stopPropagation();

      // Attendee is always selected and cannot be toggled off
      if (role === 'Attendee') return;

      const currentEventRoles = eventRoles.find((er) => er.eventUid === eventUid);
      const currentRoles = currentEventRoles?.roles || ['Attendee'];

      let newRoles: EventRole[];
      if (currentRoles.includes(role)) {
        // Remove the role (but keep Attendee)
        newRoles = currentRoles.filter((r) => r !== role);
      } else {
        // Add the role
        newRoles = [...currentRoles, role];
      }

      // Ensure Attendee is always included
      if (!newRoles.includes('Attendee')) {
        newRoles = ['Attendee', ...newRoles];
      }

      const updatedEventRoles = eventRoles.filter((er) => er.eventUid !== eventUid);
      updatedEventRoles.push({ eventUid, roles: newRoles });

      setEventRoles(updatedEventRoles);
    },
    [eventRoles],
  );

  const handleEventToggle = (eventUid: string) => {
    const isSelected = selectedEventUids.includes(eventUid);
    if (isSelected) {
      setSelectedEventUids(selectedEventUids.filter((uid) => uid !== eventUid));
      setEventRoles(eventRoles.filter((er) => er.eventUid !== eventUid));
    } else {
      setSelectedEventUids([...selectedEventUids, eventUid]);
      setEventRoles([...eventRoles, { eventUid, roles: ['Attendee'] as EventRole[] }]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredUids = filteredEvents.map((e) => e.uid);
    const allSelected = allFilteredUids.every((uid) => selectedEventUids.includes(uid));

    if (allSelected) {
      setSelectedEventUids(selectedEventUids.filter((uid) => !allFilteredUids.includes(uid)));
      setEventRoles(eventRoles.filter((er) => !allFilteredUids.includes(er.eventUid)));
    } else {
      const newSelection = [...new Set([...selectedEventUids, ...allFilteredUids])];
      setSelectedEventUids(newSelection);
      const existingEventUids = eventRoles.map((er) => er.eventUid);
      const newEventRoles: EventRoleSelection[] = allFilteredUids
        .filter((uid) => !existingEventUids.includes(uid))
        .map((uid) => ({ eventUid: uid, roles: ['Attendee'] as EventRole[] }));
      setEventRoles([...eventRoles, ...newEventRoles]);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleApply = () => {
    onApply(selectedEventUids, eventRoles);
  };

  const selectedCount = selectedEventUids.length;

  return (
    <div className={s.eventsPickerModal}>
      <div className={s.eventsPickerContent}>
        <h3 className={s.sectionTitle}>{planningQuestion}</h3>
        <p className={s.sectionDescription}>Let others know if you are attending.</p>

        <div className={s.eventsDescription}>
          <p className={s.eventsDescriptionTitle}>
            Which events are you planning to attend{locationName ? ` in ${locationName}` : ''}?
          </p>
          <p className={s.eventsDescriptionSubtitle}>
            This helps others know where they can meet you during the week. You can update this later.
          </p>
        </div>

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
            <button type="button" className={s.eventsSearchClear} onClick={handleClearSearch} aria-label="Clear search">
              <XCircleIcon />
            </button>
          )}
        </div>

        <div className={s.eventsToolbar}>
          <button type="button" className={s.eventsSelectAllBadge} onClick={handleSelectAll}>
            Select all{locationName ? ` ${locationName}` : ''} events
          </button>
          <span className={s.eventsSelectedCount}>{selectedCount} selected</span>
        </div>

        <div className={s.eventsListContainer}>
          {groupedEvents.map((group) => (
            <div key={group.dateKey} className={s.eventsDateGroup}>
              <div className={s.eventsDateHeader}>{group.dateLabel}</div>
              {group.events.map((event) => {
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
                          {formatEventDate(event.startDate, event.endDate, timezone)} · {event.attendeeCount} attending
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
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className={s.eventsEmptyState}>
              No events found matching <b>{searchQuery}</b>
            </div>
          )}
        </div>
      </div>

      <div className={s.calendarFooter}>
        <button type="button" className={s.calendarCancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={s.calendarApplyButton} onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );
}
