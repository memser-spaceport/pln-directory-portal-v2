'use client';

import { type PropsWithChildren, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

import { FEEDBACK_CAPTURE_IGNORE_ATTR } from '../screenshot-feedback/capturePage';

import s from './GiveAiAppFeedbackDialog.module.scss';
import dw from './FeedbackDrawer.module.scss';

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [role="button"]';

function tabbableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => {
    if (el.tabIndex < 0) return false;
    if (el.closest('[hidden], [aria-hidden="true"]')) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/** The narrow drawer: the popover's width, now full height on the right. */
export const FEEDBACK_DRAWER_NARROW = 480;
/** Read by the detail page (≥960px), which gives up the drawer's width beside it. */
export const FEEDBACK_DRAWER_INSET_VAR = '--ai-app-comments-inset';

interface Props {
  isOpen: boolean;
  /** Wider: min(1120px, 80vw) over the modal scrim. Narrow is non-modal. */
  wide: boolean;
  /** A capture is on screen (Pick a part, region, annotator): step out of the way, keep the layout. */
  hidden: boolean;
  /**
   * Narrow: the page gives up the drawer's width. On an app's page, where you
   * comment on and pick parts of the app beside it. Not on the grid, where
   * there is nothing to make room for: there it overlays.
   */
  reserveSpace: boolean;
  /** Names the dialog for assistive tech. */
  label: string;
}

/**
 * The feedback drawer (LAB-2767, prototype ai-apps-feedback-drawer): the
 * floating button opens a full-height drawer on the right instead of the
 * popover above it.
 *
 * - Wide is the popover's Wider mode unchanged: `.overlayWide` (scrim, full
 *   height, two-column form) and `.modalContainerWide`.
 * - Narrow (480px) is non-modal, because what you do beside it acts on the
 *   page: Pick a part drags over the app and comment mode clicks on it. Instead
 *   of covering the app, the page gives up the drawer's width (the inset var,
 *   read by the detail page at 960px and wider). Below 960 it overlays; on a
 *   phone it is the whole screen.
 *
 * While a capture is on screen the drawer is hidden but keeps its inset, so the
 * app does not jump under the crosshair. The panel appears in place: a slide
 * would cover the page the member is about to capture. Closed, it draws nothing.
 */
export function FeedbackDrawerFrame({ isOpen, wide, hidden, reserveSpace, label, children }: PropsWithChildren<Props>) {
  const panelRef = useRef<HTMLDivElement>(null);
  /* The button that opened it steps aside, so focus moves into the drawer rather than stay on a hidden control.
     Same when the drawer comes back from stepping aside (a capture, or a comment placed on a phone). */
  useEffect(() => {
    if (!isOpen || hidden) return;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
  }, [isOpen, hidden]);

  /* Tab stays in the drawer. The page beside it stays clickable (Pick a part, comments), so the
     background is not inert — only Tab is pulled back. While a capture hides the panel, the
     overlay owns the keys. */
  useEffect(() => {
    if (!isOpen || hidden) return;
    const panel = panelRef.current;
    if (!panel) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const items = tabbableIn(panel);
      if (items.length === 0) return;
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const index = active ? items.findIndex((item) => item === active || item.contains(active)) : -1;
      const leavingBackward = event.shiftKey && (index <= 0);
      const leavingForward = !event.shiftKey && (index === -1 || index === items.length - 1);
      if (!leavingBackward && !leavingForward) return;
      event.preventDefault();
      items[event.shiftKey ? items.length - 1 : 0].focus();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, hidden]);

  const reserve = isOpen && !wide && reserveSpace;
  useEffect(() => {
    if (!reserve) return;
    const root = document.documentElement;
    root.style.setProperty(FEEDBACK_DRAWER_INSET_VAR, `${FEEDBACK_DRAWER_NARROW}px`);
    return () => {
      root.style.removeProperty(FEEDBACK_DRAWER_INSET_VAR);
    };
  }, [reserve]);

  /* Opened by a click, so always on the client; closed, it draws nothing (and nothing on the server). */
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      {...{ [FEEDBACK_CAPTURE_IGNORE_ATTR]: '' }}
      className={clsx(dw.frame, wide && s.overlayWide, wide && dw.frameWide, hidden && s.overlayHidden)}
      data-testid="feedback-drawer"
      data-wide={wide ? 'true' : 'false'}
    >
      <div
        className={clsx(s.modalContainer, wide && s.modalContainerWide, dw.panel, wide ? dw.panelWide : dw.panelNarrow)}
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal={wide}
        aria-label={label}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
