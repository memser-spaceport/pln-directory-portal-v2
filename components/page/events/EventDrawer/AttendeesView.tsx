'use client';

import { useEffect, useRef } from 'react';

import { ArrowBackIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { EventAttendee } from '@/services/events/event-drawer.types';

import e from './EventDrawer.module.scss';

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

/** "Back to event" over a sub-view's title (the prototype's `SubHead`). */
export function SubHead({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className={e.subHead}>
      <button type="button" className={e.back} onClick={onBack}>
        <ArrowBackIcon width={16} height={16} />
        Back to event
      </button>
      <h2 className={e.subTitle}>{title}</h2>
    </div>
  );
}

/**
 * "N going to <event>", inside the drawer (LAB-3361, the prototype's `AttendeesView`): "Back to event", the title, a
 * search by name or team, then a row per member (photo, name, role · team, a Host / Speaker / Sponsor tag) that opens
 * their profile in a new tab. It replaces the body and keeps the toolbar; Escape returns to the event.
 *
 * Ours, not in the prototype: rows come from the strict list, 20 at a time as the drawer scrolls to the last one; the
 * viewer's own row (first, from the BE) reads "You" and is not a link.
 */
export function AttendeesView({
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

  // The next page loads when the end of the list scrolls into view.
  const sentinel = useRef<HTMLLIElement>(null);
  const loadMore = useRef(() => {});
  useEffect(() => {
    loadMore.current = () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    };
  });
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore.current();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={e.body}>
      <SubHead title={`${total} going to ${eventName}`} onBack={onBack} />
      <input
        className={e.searchInput}
        type="search"
        value={search}
        onChange={(ev) => onSearchChange(ev.target.value)}
        placeholder="Search by name or team"
        aria-label="Search people going"
      />
      <ul className={e.people} data-testid="event-attendees">
        {rows.map((a) => {
          const isViewer = !!viewerUid && a.memberUid === viewerUid;
          const meta = [a.role, a.teamName].filter(Boolean).join(' · ');
          const content = (
            <>
              <img className={e.personImg} src={a.image || getDefaultAvatar(a.name)} alt="" />
              <span className={e.personText}>
                <span className={e.personName}>{isViewer ? 'You' : a.name}</span>
                {!isViewer && meta && <span className={e.personMeta}>{meta}</span>}
              </span>
              {a.roles.length > 0 && <span className={e.personRoleTag}>{a.roles.join(' · ')}</span>}
            </>
          );
          return (
            <li key={a.memberUid}>
              {isViewer ? (
                <span className={e.person}>{content}</span>
              ) : (
                <a className={e.person} href={`/members/${a.memberUid}`} target="_blank" rel="noreferrer">
                  {content}
                </a>
              )}
            </li>
          );
        })}
        {isLoading && rows.length === 0 && <li className={e.empty}>Loading…</li>}
        {isError && rows.length === 0 && <li className={e.empty}>We couldn&apos;t load who is going.</li>}
        {!isLoading && !isError && rows.length === 0 && (
          <li className={e.empty}>
            {searching ? 'Nobody going matches that search.' : 'Nobody has said they are going yet.'}
          </li>
        )}
        {isFetchingNextPage && <li className={e.empty}>Loading…</li>}
        <li ref={sentinel} className={e.moreSentinel} aria-hidden />
      </ul>
    </div>
  );
}
