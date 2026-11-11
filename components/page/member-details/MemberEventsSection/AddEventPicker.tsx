'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { eventDay, eventMonth, eventRange } from '@/components/page/home/HomeV2/utils/upcomingEvents';
import home from '@/components/page/home/HomeV2/HomeV2.module.scss';
import { CloseIcon } from '@/components/core/UpdatesPanel/IrlGatheringModal/icons';
import m from '@/components/core/UpdatesPanel/IrlGatheringModal/IrlGatheringModal.module.scss';
import { useUpcomingEvents, type UpcomingEventsParams } from '@/services/events/hooks/useUpcomingEvents';

import s from './OwnerControls.module.scss';

/** What the list asks for: the next year of events, soonest first, as many as the API gives at once. */
export const ADD_EVENT_PICKER_QUERY: UpcomingEventsParams = { days: 365, limit: 50, sort: 'soonest' };

/** The city of an upcoming event's "City, Country" location. */
const cityOf = (location: string | null | undefined) => (location ?? '').split(',')[0].trim();

/**
 * "Add an event you're going to" (LAB-3218), the prototype's `PickView` in `member-events-going/GatheringModal.tsx`,
 * drawn with Home's event rows. Searchable by event or city; choosing a row hands its uid to the host, which opens
 * the event drawer.
 *
 * Deviation from the prototype: events the owner already has (`excludeUids`, hidden ones too) are left out rather than
 * listed with a "Going" mark, so every row is something they can add.
 */
export function AddEventPicker({
  isOpen,
  excludeUids,
  onClose,
  onPick,
}: {
  isOpen: boolean;
  excludeUids: ReadonlySet<string>;
  onClose: () => void;
  onPick: (eventUid: string) => void;
}) {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useUpcomingEvents(ADD_EVENT_PICKER_QUERY, { enabled: isOpen });

  const addable = useMemo(
    () => (Array.isArray(data) ? data : []).filter((event) => !excludeUids.has(event.uid)),
    [data, excludeUids],
  );
  const needle = query.trim().toLowerCase();
  const rows = needle
    ? addable.filter((event) => `${event.name} ${event.location ?? ''}`.toLowerCase().includes(needle))
    : addable;

  const close = () => {
    setQuery('');
    onClose();
  };

  let status: string | null = null;
  if (isLoading) status = 'Loading…';
  else if (isError) status = "We couldn't load upcoming events.";
  else if (addable.length === 0) status = "You're already going to every upcoming event we know of.";
  else if (rows.length === 0) status = 'No upcoming events match that search.';

  return (
    <Modal isOpen={isOpen} onClose={close} overlayClassname={m.modalOverlay}>
      <div className={m.modal}>
        <div className={m.header}>
          <div className={m.headerContent}>
            <div className={m.headerText}>
              <h2 className={m.title}>Add an event you&apos;re going to</h2>
            </div>
          </div>
          <button className={m.closeButton} onClick={close} aria-label="Close" type="button">
            <CloseIcon />
          </button>
        </div>
        <div className={s.searchWrap}>
          <input
            className={s.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by event or city"
            aria-label="Search upcoming events"
          />
        </div>
        <ul className={clsx(home.roleList, s.pickList)} aria-label="Upcoming events">
          {rows.map((event) => {
            const range = eventRange(event.startDate, event.endDate);
            const city = cityOf(event.location);
            return (
              <li key={event.uid} className={clsx(home.roleRow, home.jobRow, home.eventRow, s.pickRow)}>
                <span className={home.dateTile} aria-hidden>
                  <span className={home.dateMonth}>{eventMonth(event.startDate)}</span>
                  <span className={home.dateDay}>{eventDay(event.startDate)}</span>
                </span>
                <span className={home.jobText}>
                  <button
                    type="button"
                    className={clsx(home.roleTitle, home.jobTitle, home.eventLink, home.eventPress)}
                    onClick={() => {
                      setQuery('');
                      onPick(event.uid);
                    }}
                  >
                    {event.name}
                  </button>
                  <span className={home.roleLocation}>{[range, city].filter(Boolean).join(' · ')}</span>
                </span>
              </li>
            );
          })}
          {status && <li className={s.noResults}>{status}</li>}
        </ul>
      </div>
    </Modal>
  );
}
