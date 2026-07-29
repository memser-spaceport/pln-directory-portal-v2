'use client';

import clsx from 'clsx';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { FocusEvent } from 'react';

import { ArrowRightIcon, CloseIcon, InboxZeroIcon } from './icons';
// The design-system search field, imported not rebuilt.
import { SearchInput } from '@/components/common/filters/SearchInput';
// The same expand-inline control the newsfeed and the full Updates page use,
// imported rather than re-approximated — so all three surfaces open search the
// same way instead of this one toggling a row of its own.
import { HeaderSearch } from '../newsfeed-v0/HeaderSearch';
import nf from '../newsfeed-v0/NewsfeedV0.module.scss';
import { HubItem } from './HubItem';
import { applyView, ViewSwitch, type HubView } from './ViewSwitch';
import { matchesQuery } from './search';
import type { HubNotification } from './mocks';

import s from './NotificationsHub.module.scss';

export type PanelStatus = 'ready' | 'loading' | 'error';

type Props = {
  open: boolean;
  // Same widening as HubBell's buttonRef — useRef(null) yields `T | null`.
  anchorRef: React.RefObject<HTMLElement | null>;
  status: PanelStatus;
  notifications: HubNotification[];
  unreadCount: number;
  view: HubView;
  onViewChange: (next: HubView) => void;
  query: string;
  onQueryChange: (next: string) => void;
  onClose: () => void;
  onToggleRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpen: (n: HubNotification) => void;
  /** In-panel search, scoped to this list (the nav field covers the directory). */
  searchOpen: boolean;
  onToggleSearch: () => void;
  onRetry: () => void;
  onViewAll: () => void;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Below this the panel is a full-screen sheet and the stylesheet owns its geometry. */
const MOBILE_BREAKPOINT = 640;
/** Distance from the trigger. */
const GAP = 8;
/** Distance kept from every viewport edge. */
const EDGE = 16;
/**
 * The height to aim for: roughly three notifications plus the panel's chrome
 * (header ~70, filter row ~52, footer ~53, three rows ~510 with gaps).
 *
 * It's a floor, not a cap — where there's more room the panel still fills it,
 * matching production. Below this the panel would rather flip above the trigger
 * than show a stub of a list.
 */
const MIN_HEIGHT = 690;
/**
 * No ceiling beyond the room that actually exists — matching production.
 *
 * `UpdatesPanel` sits at a fixed `top: 72px` with `max-height: calc(100vh -
 * 80px)`. With the bell's bottom edge near 56px, GAP (8) and EDGE (16) make
 * `room` resolve to `innerHeight - 80` — production's formula exactly. So the
 * panel matches dev by deriving its height the same way, rather than by
 * carrying a separate pixel cap that would diverge on every other viewport.
 */

/**
 * The bell dropdown.
 *
 * Against production's `UpdatesPanel` this adds: dialog semantics, Escape,
 * a focus trap and focus restoration, positioning anchored to the bell rather
 * than a hardcoded `top: 72px; right: 20px`, an All/Unread/Read switch, a
 * visible mark-all, and real loading and error states.
 *
 * Search is scoped to this list and toggled from beside the title — the nav
 * field covers the directory, this one covers your updates. Same icon, and the
 * scope is legible from where each one sits.
 */
export function HubPanel(props: Props) {
  const {
    open,
    anchorRef,
    status,
    notifications,
    unreadCount,
    view,
    onViewChange,
    query,
    onQueryChange,
    onClose,
    onToggleRead,
    onMarkAllRead,
    onOpen,
    searchOpen,
    onToggleSearch,
    onRetry,
    onViewAll,
  } = props;

  const panelRef = useRef<HTMLDivElement>(null);
  // Where focus came from, so it can be handed back on close.
  const restoreRef = useRef<HTMLElement | null>(null);
  // SearchInput doesn't forward a ref, so focus goes through its wrapper.
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => applyView(notifications, view).filter((n) => matchesQuery(n, query)),
    [notifications, view, query],
  );

  /**
   * Anchor to the trigger, and size to the room that actually exists.
   *
   * A fixed panel cannot be scrolled into view by scrolling the page — it
   * moves with the viewport — so any part of it below the fold is simply
   * unreachable. A static `max-height: calc(100vh - 96px)` assumes the panel
   * starts near the top of the window; the moment the trigger sits further
   * down, that overflows by exactly how far down it sits. So measure the gap
   * between the trigger and the viewport edge, and clamp to it.
   *
   * When there genuinely isn't room below, flip above the trigger rather than
   * squeezing the list into a sliver.
   */
  const position = useCallback(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!panel || !anchor) return;

    // Below the mobile breakpoint the panel is a full-screen sheet; the
    // stylesheet owns its geometry, so clear anything set here.
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      panel.style.top = '';
      panel.style.left = '';
      panel.style.maxHeight = '';
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const width = panel.offsetWidth;

    // Keep the panel on screen if the trigger sits near the right edge.
    const left = Math.max(EDGE, Math.min(rect.right - width, window.innerWidth - width - EDGE));

    const spaceBelow = window.innerHeight - rect.bottom - GAP - EDGE;
    const spaceAbove = rect.top - GAP - EDGE;

    // Flip up only when below is too cramped to be usable *and* above is
    // genuinely better — otherwise dropping down stays the predictable default.
    const flipUp = spaceBelow < MIN_HEIGHT && spaceAbove > spaceBelow;
    const room = flipUp ? spaceAbove : spaceBelow;

    // The floor may exceed the room on a short window, so clamp to the viewport
    // as a hard stop — a fixed panel that overruns the fold cannot be scrolled
    // back into view, which is the failure this whole calculation exists to
    // prevent.
    const maxSafe = window.innerHeight - EDGE * 2;
    const height = Math.min(maxSafe, Math.max(MIN_HEIGHT, room));

    let top = flipUp ? Math.max(EDGE, rect.top - GAP - height) : rect.bottom + GAP;

    // When the floor won over a smaller `room`, the panel is taller than the
    // gap it was placed in — slide it back up so its bottom edge stays on
    // screen rather than hanging off the fold.
    const overhang = top + height - (window.innerHeight - EDGE);
    if (overhang > 0) top = Math.max(EDGE, top - overhang);

    panel.style.maxHeight = `${height}px`;
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }, [anchorRef]);

  // Layout effect, not effect: the panel must be placed before first paint, or
  // it flashes at the top-left of the viewport for a frame.
  useLayoutEffect(() => {
    if (!open) return;
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open, position]);

  // Escape closes; Tab is trapped inside the panel while it is open.
  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Move focus in on open, and hand it back to the bell on close.
  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      return;
    }
    restoreRef.current?.focus();
  }, [open]);

  // Opening search should put the caret in the field — otherwise the icon
  // reveals an input and then asks you to click it.
  useEffect(() => {
    if (open && searchOpen) searchWrapRef.current?.querySelector('input')?.focus();
  }, [open, searchOpen]);

  /**
   * Collapse the field when focus leaves it, unless something has been typed —
   * a live query keeps it open so an active filter is never hidden behind an
   * icon. Reads the input's live value rather than the debounced `query`, so a
   * just-typed or just-cleared field is judged by what's actually on screen.
   *
   * Transcribed from the newsfeed and the full Updates page so all three
   * surfaces dismiss search identically. This replaces a document-level
   * mousedown listener: blur already fires on any click that moves focus, and
   * it can't fight the toggle's own onClick.
   */
  const handleFieldBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    const live = e.currentTarget.querySelector('input')?.value ?? '';
    if (!live.trim()) onToggleSearch();
  };

  // The field appearing/disappearing changes the panel's height, so re-measure.
  useLayoutEffect(() => {
    if (open) position();
  }, [open, searchOpen, position]);

  if (!open) return null;

  const searching = query.trim().length > 0;
  const showList = status === 'ready' && visible.length > 0;
  const showEmpty = status === 'ready' && visible.length === 0;

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />

      <div ref={panelRef} className={s.panel} role="dialog" aria-modal="true" aria-label="Updates">
        <div className={s.panelHeader}>
          <div className={s.titleRow}>
            <h2 className={s.title}>Updates</h2>
            {/*
              Sits beside the title, not out at the right edge with Close —
              the same placement Network updates uses (NewsBase header: title,
              then headerActions, 12px gap). Search belongs to the list it
              filters, so it reads as part of the heading; Close acts on the
              panel, so it stays in the far corner. Grouping them together
              made two unrelated actions look like a pair.
            */}
            <div className={s.panelSearch}>
              <HeaderSearch
                open={searchOpen}
                value={query}
                onOpen={onToggleSearch}
                onChange={onQueryChange}
                onBlur={handleFieldBlur}
                fieldRef={searchWrapRef}
              />
            </div>
          </div>

          <div className={s.headerActions}>
            <button type="button" className={s.iconButton} onClick={onClose} aria-label="Close updates">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Mobile only: a full-screen sheet's header has no room to expand
            inline, so the field lives here as a permanent full-width row —
            the same fallback the newsfeed and the Updates page use. */}
        <div className={nf.mobileSearchRow}>
          <SearchInput value={query} onChange={onQueryChange} placeholder="Search your updates" />
        </div>

        {/*
          The filter row. Tabs sit here rather than in the header: the header
          is identity ("Updates") plus window controls, and All/Unread/Read is
          scoping — it belongs against the list it scopes, next to the bulk
          action that operates on the same set.
        */}
        <div className={s.searchRow}>
          <ViewSwitch view={view} unreadCount={unreadCount} onChange={onViewChange} />

          {/*
            The match count moved here with the field going inline: it used to
            sit inside the search row, which meant collapsing the field hid the
            only evidence the list was filtered. Against the tabs it stays
            visible for as long as the filter is actually applied.
          */}
          {searching && (
            <span className={s.resultCount}>
              {visible.length} {visible.length === 1 ? 'match' : 'matches'}
            </span>
          )}

          {/* Hidden on mobile — the sheet already repeats it in the thumb zone. */}
          <button
            type="button"
            className={clsx(s.markAllLink, s.searchRowAction)}
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
        </div>

        {/*
          No separate "filtered by" chip here — the field above already shows
          the query and its match count, so a chip would only restate it.
        */}

        <div className={s.panelBody}>
          {status === 'loading' && <PanelSkeleton />}

          {status === 'error' && (
            <div className={s.errorState} role="alert">
              <p className={s.errorTitle}>Couldn&apos;t load your updates</p>
              <p className={s.errorBody}>The connection dropped. Your updates are safe — nothing was marked as read.</p>
              <button type="button" className={s.retryButton} onClick={onRetry}>
                Try again
              </button>
            </div>
          )}

          {showEmpty && (
            <div className={s.emptyState}>
              <InboxZeroIcon className={s.emptyIcon} />
              {searching ? (
                <>
                  <p className={s.emptyTitle}>No matches</p>
                  <p className={s.emptyBody}>Nothing here matches “{query.trim()}”.</p>
                  <button type="button" className={s.emptyAction} onClick={() => onQueryChange('')}>
                    Clear search
                  </button>
                </>
              ) : view === 'unread' ? (
                <>
                  <p className={s.emptyTitle}>You&apos;re all caught up</p>
                  <p className={s.emptyBody}>Nothing unread right now.</p>
                  <button type="button" className={s.emptyAction} onClick={() => onViewChange('all')}>
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
          )}

          {showList &&
            visible.map((n) => (
              <HubItem key={n.id} notification={n} variant="panel" onToggleRead={onToggleRead} onOpen={onOpen} />
            ))}
        </div>

        <div className={s.panelFooter}>
          <button type="button" className={s.viewAllLink} onClick={onViewAll}>
            {/* Production's label, verbatim. */}
            View all recent updates
            <ArrowRightIcon />
          </button>

          {/*
            Mobile only: mark-all repeats at the bottom of the sheet, in the
            thumb zone (Digg's placement).
          */}
          <button type="button" className={s.footerMarkAll} onClick={onMarkAllRead} disabled={unreadCount === 0}>
            Mark all as read
          </button>
        </div>
      </div>
    </>
  );
}

function PanelSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className={s.skeletonRow} aria-hidden="true">
          <div className={s.skelCircle} />
          <div className={s.skelBody}>
            <div className={clsx(s.skelLine, s.skelShort)} />
            <div className={clsx(s.skelLine, s.skelLong)} />
            <div className={clsx(s.skelLine, s.skelMid)} />
          </div>
        </div>
      ))}
      <span className={s.srOnly} role="status" aria-live="polite">
        Loading updates
      </span>
    </>
  );
}
