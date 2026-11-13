'use client';

import type { UIEvent } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { CloseIcon } from '@/components/core/UpdatesPanel/IrlGatheringModal/icons';
import m from '@/components/core/UpdatesPanel/IrlGatheringModal/IrlGatheringModal.module.scss';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { EventAttendee } from '@/services/events/event-drawer.types';

import s from './AttendeesModal.module.scss';

export interface EventAttendeesState {
  rows: EventAttendee[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /** What the member typed; the host debounces it into the query. */
  search: string;
  onSearchChange: (search: string) => void;
}

/** Pixels from the bottom of the list at which the next page loads. */
const LOAD_MORE_THRESHOLD = 120;

/**
 * "N going to <event>": the attendees of one event, above the drawer (LAB-3216). Ported from the prototype's
 * `AttendeesView` in `GatheringModal.tsx`.
 *
 * Deviations from the prototype, by the spec (Escape and the backdrop close the top layer first): Close, Escape and
 * the backdrop return to the drawer instead of closing it too. Rows come from the strict list, the viewer's own row
 * (first, from the BE) reads "You", and the list loads 20 at a time as it scrolls.
 */
export function AttendeesModal({
  eventName,
  total,
  viewerUid,
  attendees,
  onBack,
}: {
  eventName: string;
  total: number;
  viewerUid: string | null;
  attendees: EventAttendeesState;
  onBack: () => void;
}) {
  const { rows, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, search, onSearchChange } =
    attendees;
  const searching = search.trim().length > 0;

  const onScroll = (event: UIEvent<HTMLUListElement>) => {
    const el = event.currentTarget;
    if (hasNextPage && !isFetchingNextPage && el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_THRESHOLD) {
      fetchNextPage();
    }
  };

  return (
    <Modal isOpen onClose={onBack} overlayClassname={m.modalOverlay}>
      <div className={m.modal}>
        <div className={m.header}>
          <div className={m.headerContent}>
            <button type="button" className={s.backButton} onClick={onBack} aria-label="Back">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M10 3.5L5.5 8L10 12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className={m.headerText}>
              <h2 className={m.title}>
                {total} going to {eventName}
              </h2>
            </div>
          </div>
          <button className={m.closeButton} onClick={onBack} aria-label="Close" type="button">
            <CloseIcon />
          </button>
        </div>
        <div className={s.searchWrap}>
          <input
            className={s.search}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or team"
            aria-label="Search people going"
          />
        </div>
        <ul className={s.attendees} onScroll={onScroll} data-testid="event-attendees">
          {rows.map((a) => {
            const isViewer = !!viewerUid && a.memberUid === viewerUid;
            const meta = [a.role, a.teamName].filter(Boolean).join(' · ');
            const content = (
              <>
                <img className={s.attendeeImg} src={a.image || getDefaultAvatar(a.name)} alt="" />
                <span className={s.attendeeText}>
                  <span className={s.attendeeName}>{isViewer ? 'You' : a.name}</span>
                  {!isViewer && meta && <span className={s.attendeeMeta}>{meta}</span>}
                </span>
                {a.roles.length > 0 && <span className={s.attendeeTag}>{a.roles.join(' · ')}</span>}
              </>
            );
            return (
              <li key={a.memberUid}>
                {isViewer ? (
                  <span className={s.attendee}>{content}</span>
                ) : (
                  <a className={s.attendee} href={`/members/${a.memberUid}`} target="_blank" rel="noreferrer">
                    {content}
                  </a>
                )}
              </li>
            );
          })}
          {isLoading && rows.length === 0 && <li className={s.noResults}>Loading…</li>}
          {isError && rows.length === 0 && <li className={s.noResults}>We couldn&apos;t load who is going.</li>}
          {!isLoading && !isError && rows.length === 0 && (
            <li className={s.noResults}>
              {searching ? 'Nobody going matches that search.' : 'Nobody has said they are going yet.'}
            </li>
          )}
          {isFetchingNextPage && <li className={s.noResults}>Loading…</li>}
        </ul>
      </div>
    </Modal>
  );
}
