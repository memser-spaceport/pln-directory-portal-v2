'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import btn from '@/components/common/Button/Button.module.scss';
import { ArrowUpRightIcon, CaretLeftIcon, CaretRightIcon, CheckIcon, CloseIcon } from '@/components/icons';

import { ChainIcon } from './EventSummary';
import e from './EventDrawer.module.scss';

export interface DrawerToolbarProps {
  /** The event on show; without one (loading, failed, missing) the toolbar has Close only. */
  eventUid: string | null;
  /** "Open in PL Events" goes here; left out when null. */
  eventsAppHref: string | null;
  prev: string | null;
  next: string | null;
  /** Previous / next show only when the drawer was opened from a list of more than one event, on the event itself. */
  showStepper: boolean;
  onNavigate: (uid: string, direction: 'previous' | 'next') => void;
  onClose: () => void;
  onCopied?: () => void;
  onEventsAppOpened?: () => void;
}

/** The address Copy link puts on the clipboard: All Events with this event's drawer open. */
export const eventShareUrl = (uid: string) => `${window.location.origin}/events/all?event=${encodeURIComponent(uid)}`;

/**
 * The drawer's toolbar, pinned at the top (LAB-3361, the prototype's `Toolbar`, Luma's side peek): Copy link and
 * Open in PL Events ↗ on the left; previous / next through the list the drawer was opened from, a rule, and close on
 * the right. On phones Copy link is its icon only.
 */
export function DrawerToolbar({
  eventUid,
  eventsAppHref,
  prev,
  next,
  showStepper,
  onNavigate,
  onClose,
  onCopied,
  onEventsAppOpened,
}: DrawerToolbarProps) {
  const [copied, setCopied] = useState(false);
  // The toolbar mounts afresh with each event (the drawer keys its body by event), so "Copied" never carries over.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    if (!eventUid) return;
    try {
      await navigator.clipboard.writeText(eventShareUrl(eventUid));
    } catch {
      // The clipboard can be refused (insecure origin, permissions); the label still confirms the press.
    }
    setCopied(true);
    onCopied?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={e.toolbar} data-testid="event-drawer-toolbar">
      <div className={e.toolbarGroup}>
        {eventUid && (
          <Button
            type="button"
            style="border"
            variant="neutral"
            size="xs"
            className={e.btn}
            onClick={copy}
            aria-label={copied ? 'Link copied' : 'Copy link'}
          >
            {copied ? <CheckIcon width={14} height={14} /> : <ChainIcon size={14} />}
            <span className={e.btnLabelWide}>{copied ? 'Copied' : 'Copy link'}</span>
          </Button>
        )}
        {eventUid && eventsAppHref && (
          <a
            href={eventsAppHref}
            target="_blank"
            rel="noreferrer"
            className={clsx(btn.root, btn.xs, btn.border, btn.neutral, e.btn)}
            onClick={onEventsAppOpened}
          >
            Open in PL Events
            <ArrowUpRightIcon width={14} height={14} />
          </a>
        )}
      </div>
      <div className={e.toolbarGroup}>
        {showStepper && (
          <>
            <button
              type="button"
              className={e.iconBtn}
              onClick={() => prev && onNavigate(prev, 'previous')}
              disabled={!prev}
              aria-label="Previous event"
            >
              <CaretLeftIcon width={16} height={16} />
            </button>
            <button
              type="button"
              className={e.iconBtn}
              onClick={() => next && onNavigate(next, 'next')}
              disabled={!next}
              aria-label="Next event"
            >
              <CaretRightIcon width={16} height={16} />
            </button>
            <span className={e.toolbarRule} aria-hidden />
          </>
        )}
        <button type="button" className={e.iconBtn} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
