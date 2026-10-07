'use client';

import { type PropsWithChildren, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

import s from './GiveAiAppFeedbackDialog.module.scss';
import dw from './FeedbackDrawer.module.scss';

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
 * app does not jump under the crosshair. No exit animation: `AnimatePresence`
 * does not unmount reliably here (see `Modal`), and a lingering panel would stay
 * in the accessibility tree.
 */
export function FeedbackDrawerFrame({ isOpen, wide, hidden, reserveSpace, label, children }: PropsWithChildren<Props>) {
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
      className={clsx(dw.frame, wide && s.overlayWide, wide && dw.frameWide, hidden && s.overlayHidden)}
      data-testid="feedback-drawer"
      data-wide={wide ? 'true' : 'false'}
    >
      <motion.div
        className={clsx(s.modalContainer, wide && s.modalContainerWide, dw.panel, wide ? dw.panelWide : dw.panelNarrow)}
        role="dialog"
        aria-modal={wide}
        aria-label={label}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>,
    document.body,
  );
}
