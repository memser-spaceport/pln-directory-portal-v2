'use client';

import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { HubBell } from './HubBell';
import { HubPanel, type PanelStatus } from './HubPanel';
import { CloseIcon, SearchIcon } from './icons';
import { useHubNotifications } from './useHubNotifications';
import type { HubView } from './ViewSwitch';
import type { HubNotification } from './mocks';

import s from './NotificationsHub.module.scss';

/**
 * Notifications hub — the bell panel.
 *
 * The full Updates page lives in its own entry (`notifications-inbox`); both
 * share `useHubNotifications`, `HubItem` and this SCSS module so the two
 * surfaces stay identical in behaviour.
 *
 * Changes versus the production `UpdatesPanel`, commented at each site: read
 * state is decoupled from navigation, every reversible action raises an undo
 * toast, the panel behaves like a dialog, loading and error have real states
 * rather than falling through to "No new updates", the decorative unread badge
 * became an All/Unread/Read switch, and search is promoted to navigation level
 * rather than nested inside the dropdown.
 */
export default function NotificationsHubPrototype() {
  // The panel and its menu are client-only; gate render so SSR === first
  // client render (prototype routes are server-rendered).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hub = useHubNotifications();

  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState<HubView>('all');
  const [status, setStatus] = useState<PanelStatus>('ready');

  // Two searches, two scopes. `navQuery` is the directory search that already
  // exists in production (ApplicationSearch, which indexes teams / members /
  // events / projects and does NOT cover notifications). `query` is the panel's
  // own field, scoped to this list.
  const [navQuery, setNavQuery] = useState('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const bellRef = useRef<HTMLButtonElement>(null);

  /** Closing the field clears its query, so a hidden filter can never persist. */
  const toggleSearch = useCallback(() => {
    setSearchOpen((wasOpen) => {
      if (wasOpen) setQuery('');
      return !wasOpen;
    });
  }, []);

  const openNotification = useCallback(
    (n: HubNotification) => {
      hub.markRead(n.id);
      setPanelOpen(false);
    },
    [hub],
  );

  const viewAll = useCallback(() => {
    setPanelOpen(false);
    hub.showToast('The full Updates page is the "notifications-inbox" prototype');
  }, [hub]);

  const simulate = useCallback((next: PanelStatus) => {
    setStatus(next);
    setPanelOpen(true);
  }, []);

  const retry = useCallback(() => {
    setStatus('loading');
    setTimeout(() => setStatus('ready'), 900);
  }, []);

  if (!mounted) return <div className={s.page} />;

  return (
    <div className={s.page}>
      <div className={s.shell}>
        {/*
          The trigger leads the page, not the explanation.

          The panel is `position: fixed` and sizes itself to the room below its
          trigger, so wherever the bell sits decides how many notifications fit.
          In production the bell is in the navbar near the top of the viewport;
          burying it under a paragraph here made the panel far shorter than it
          would ever be in the real app, which is a prototype artefact rather
          than a design decision.

          A labelled trigger card rather than a mock navbar: every prototype
          route already renders the real SiteHeader above this one, so a second
          full-width bar would read as a duplicate.
        */}
        <div className={s.triggerStrip}>
          {/*
            The navbar's global search, standing in for production's
            ApplicationSearch. It covers the directory — teams, members, events,
            projects — and deliberately does NOT filter the notification list:
            searching your updates is the panel's own field, opened from its
            header icon. Same glyph, two scopes, each next to what it searches.
          */}
          <div className={s.navSearch}>
            <SearchIcon />
            <input
              type="search"
              className={s.searchInput}
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="Search teams, members, events, projects"
              aria-label="Search the directory"
            />
            {navQuery.trim() ? (
              <button
                type="button"
                className={s.searchClear}
                onClick={() => setNavQuery('')}
                aria-label="Clear search"
              >
                <CloseIcon width={14} height={14} />
              </button>
            ) : (
              <span className={s.navSearchHint}>⌘K</span>
            )}
          </div>

          <HubBell
            unreadCount={hub.unreadCount}
            open={panelOpen}
            buttonRef={bellRef}
            onToggle={() => {
              setStatus('ready');
              setPanelOpen((v) => !v);
            }}
          />
        </div>

        <p className={s.note}>
          <strong>Bell panel — reworked.</strong> <strong>All / Unread / Read</strong> tabs scope the list from
          the filter row, beside the bulk action they share a set with. Search sits next to the title and
          filters this list; the navbar field above covers the directory. Read state is no longer tied to
          navigating away: hover any row for a tick that marks it read, click again to undo. Nothing here
          deletes — read/unread is the whole state space, and both it and Mark all as read raise a toast with{' '}
          <strong>Undo</strong>. The panel takes Escape, traps focus, and returns focus to the bell. The buttons
          below open it straight into the loading and error states the production panel never shows.
        </p>

        <div className={s.controls}>
          <span className={s.controlLabel}>Simulate:</span>
          <button
            type="button"
            className={clsx(s.controlButton, status === 'loading' && panelOpen && s.controlButtonActive)}
            onClick={() => simulate('loading')}
          >
            First load
          </button>
          <button
            type="button"
            className={clsx(s.controlButton, status === 'error' && panelOpen && s.controlButtonActive)}
            onClick={() => simulate('error')}
          >
            Fetch failure
          </button>
          <button type="button" className={s.controlButton} onClick={hub.reset}>
            Reset data
          </button>
        </div>
      </div>

      <HubPanel
        open={panelOpen}
        anchorRef={bellRef}
        status={status}
        notifications={hub.notifications}
        unreadCount={hub.unreadCount}
        view={view}
        onViewChange={setView}
        query={query}
        onQueryChange={setQuery}
        onClose={() => setPanelOpen(false)}
        onToggleRead={hub.toggleRead}
        onMarkAllRead={hub.markAllRead}
        onOpen={openNotification}
        searchOpen={searchOpen}
        onToggleSearch={toggleSearch}
        onRetry={retry}
        onViewAll={viewAll}
      />
    </div>
  );
}
