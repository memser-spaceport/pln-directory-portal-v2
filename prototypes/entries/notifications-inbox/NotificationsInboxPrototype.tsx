'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent } from 'react';

import { getDateBucket, type DateBucket } from '../notifications-hub/categories';
import { HubItem } from '../notifications-hub/HubItem';
import { InboxZeroIcon } from '../notifications-hub/icons';
import { matchesQuery } from '../notifications-hub/search';

// The design-system search field, imported not rebuilt — the same component the
// Teams and Members toolbars use.
import { SearchInput } from '@/components/common/filters/SearchInput';
// The newsfeed page's header-search behaviour and styling, imported from that
// entry so the two pages cannot drift apart.
import { HeaderSearch } from '../newsfeed-v0/HeaderSearch';
import nf from '../newsfeed-v0/NewsfeedV0.module.scss';
import { useHubNotifications } from '../notifications-hub/useHubNotifications';
import { applyView, ViewSwitch, type HubView } from '../notifications-hub/ViewSwitch';
import type { HubNotification } from '../notifications-hub/mocks';

// Same module as the bell panel — the two surfaces share one vocabulary rather
// than drifting into two renderers of the same list.
import s from '../notifications-hub/NotificationsHub.module.scss';

const BUCKET_ORDER: DateBucket[] = ['Today', 'Yesterday', 'Earlier'];

/**
 * Notifications hub — the full Updates page.
 *
 * The standalone counterpart to the `notifications-hub` bell panel. Changes
 * versus production's `RecentUpdatesSection`:
 *
 * - Date grouping (Today / Yesterday / Earlier). Production renders one flat
 *   reverse-chronological list, so "when" has to be read off each row.
 * - An unread filter, built from the count badge that is decorative today.
 * - Mark all as read, with an undo window. Production wires `markAllAsRead`
 *   through the provider and the service but no component ever calls it.
 * - A terminator. Production's infinite scroll simply stops.
 * - Per-row read toggle and dismiss, so clearing an item no longer requires
 *   navigating to its destination.
 */
export default function NotificationsInboxPrototype() {
  // Rows carry interactive controls; gate render so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hub = useHubNotifications();
  const [view, setView] = useState<HubView>('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const desktopFieldRef = useRef<HTMLDivElement>(null);

  const searching = query.trim().length > 0;

  // Desktop only: collapse the inline field when focus leaves it while empty; a
  // live query keeps it open so an active filter is never hidden. Reads the live
  // input value (not the debounced `query`) so a just-typed/just-cleared field
  // is judged by what's on screen. Transcribed from the newsfeed page.
  const handleFieldBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    const live = e.currentTarget.querySelector('input')?.value ?? '';
    if (!live.trim()) setSearchOpen(false);
  };

  // Focus the field the moment it expands.
  useEffect(() => {
    if (!searchOpen) return;
    desktopFieldRef.current?.querySelector('input')?.focus();
  }, [searchOpen]);

  const visible = useMemo(
    () => applyView(hub.notifications, view).filter((n) => matchesQuery(n, query)),
    [hub.notifications, view, query],
  );

  const grouped = useMemo(() => {
    const map = new Map<DateBucket, HubNotification[]>();
    for (const n of visible) {
      const bucket = getDateBucket(n.minutesAgo);
      const list = map.get(bucket);
      if (list) list.push(n);
      else map.set(bucket, [n]);
    }
    return BUCKET_ORDER.filter((b) => map.has(b)).map((b) => ({ bucket: b, items: map.get(b)! }));
  }, [visible]);

  if (!mounted) return <div className={s.page} />;

  return (
    <div className={s.page}>
      <div className={s.shell}>
        <p className={s.note}>
          <strong>Full Updates page — reworked.</strong> Grouped by day, filterable by All / Unread / Read, and
          closed with a terminator. Search is navigation-level chrome above the page, not a field on it. Hover
          any row for a tick that marks it read, click again to undo. Nothing here deletes — read/unread is the
          whole state space, and both it and Mark all as read raise a toast with <strong>Undo</strong>. The bell
          panel is the <strong>notifications-hub</strong> prototype.
        </p>

        <section aria-labelledby="inbox-title">
          {/*
            Title and search share the top line. Search is scoped to this
            page's list — the same scope as the panel's field — and stays
            visible rather than hiding behind an icon: the panel hides it
            because a dropdown has no room to spare, and a full page does.
          */}
          <div className={s.inboxHeader}>
            <h1 id="inbox-title" className={s.inboxTitle}>
              Updates
            </h1>

            {/*
              The newsfeed page's header search, imported from that entry
              rather than re-approximated: on desktop an icon that expands
              inline into the production SearchInput, on mobile hidden in
              favour of the permanent full-width row below.
            */}
            <div className={s.pageSearch}>
              <HeaderSearch
                open={searchOpen}
                value={query}
                onOpen={() => setSearchOpen(true)}
                onChange={setQuery}
                onBlur={handleFieldBlur}
                fieldRef={desktopFieldRef}
              />
            </div>
          </div>

          {/* Mobile only: the header has no room to expand inline, so the field
              lives here as a permanent full-width row — same as the newsfeed. */}
          <div className={nf.mobileSearchRow}>
            <SearchInput value={query} onChange={setQuery} placeholder="Search your updates" />
          </div>

          {/*
            Scoping sits on its own line under the header, against the list it
            scopes and beside the bulk action that operates on the same set —
            the same arrangement as the panel's filter row.
          */}
          <div className={s.inboxFilters}>
            <div className={s.inboxFiltersLeft}>
              <ViewSwitch view={view} unreadCount={hub.unreadCount} onChange={setView} />
              {searching && (
                <span className={s.resultCount}>
                  {visible.length} {visible.length === 1 ? 'match' : 'matches'}
                </span>
              )}
            </div>

            <button
              type="button"
              className={s.markAllLink}
              onClick={hub.markAllRead}
              disabled={hub.unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

          <div className={s.card}>
            {visible.length === 0 ? (
              <div className={s.emptyState}>
                <InboxZeroIcon className={s.emptyIcon} />
                {searching ? (
                  <>
                    <p className={s.emptyTitle}>No matches</p>
                    <p className={s.emptyBody}>Nothing here matches “{query.trim()}”.</p>
                    <button type="button" className={s.emptyAction} onClick={() => setQuery('')}>
                      Clear search
                    </button>
                  </>
                ) : view === 'unread' ? (
                  <>
                    <p className={s.emptyTitle}>You&apos;re all caught up</p>
                    <p className={s.emptyBody}>Nothing unread right now.</p>
                    <button type="button" className={s.emptyAction} onClick={() => setView('all')}>
                      Show all updates
                    </button>
                  </>
                ) : view === 'read' ? (
                  <>
                    <p className={s.emptyTitle}>Nothing read yet</p>
                    <p className={s.emptyBody}>Updates you&apos;ve read will collect here.</p>
                  </>
                ) : (
                  <>
                    <p className={s.emptyTitle}>No updates yet</p>
                    <p className={s.emptyBody}>
                      Relevant updates from forum, Demo Day, events, and the teams you follow will appear here.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {grouped.map(({ bucket, items }) => (
                  <React.Fragment key={bucket}>
                    <h2 className={s.groupLabel}>{bucket}</h2>
                    <div className={s.groupList}>
                      {items.map((n) => (
                        <HubItem
                          key={n.id}
                          notification={n}
                          variant="page"
                          onToggleRead={hub.toggleRead}
                          onOpen={(item) => hub.markRead(item.id)}
                        />
                      ))}
                    </div>
                  </React.Fragment>
                ))}

                <p className={s.endOfList}>That&apos;s everything from the last 30 days.</p>
              </>
            )}
          </div>
        </section>

        <div className={s.controls}>
          <span className={s.controlLabel}>Prototype:</span>
          <button type="button" className={s.controlButton} onClick={hub.reset}>
            Reset data
          </button>
        </div>
      </div>
    </div>
  );
}
