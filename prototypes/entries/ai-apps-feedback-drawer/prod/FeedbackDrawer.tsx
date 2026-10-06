'use client';

import { type PropsWithChildren, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';

import { CommentIcon } from '@/components/icons';
// Production Drawer's container chrome (white full-height column, left shadow),
// the feedback dialog's own wide overlay (scrim + two-column form), and develop's
// Feedback | Comment segmented control, all imported by class.
import dr from '@/components/common/Drawer/Drawer.module.scss';
import s from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
import tabs from '@/components/page/ai-apps/components/FeedbackTabs/FeedbackTabs.module.scss';

import { CAPTURE_IGNORE_ATTR } from '../threads/nativeCapture';
import dw from './FeedbackDrawer.module.scss';

/** The narrow drawer: production's popover width, now full height on the right. */
export const FEEDBACK_DRAWER_NARROW = 480;
const INSET_VAR = '--feedback-drawer-inset';

interface FrameProps {
  isOpen: boolean;
  /** Production's Wider: 80vw over the modal scrim. Narrow is non-modal. */
  wide: boolean;
  /** A capture is on screen (Pick a part, region, annotator): step out of the way, keep the layout. */
  hidden: boolean;
  /**
   * Narrow: the page gives up the drawer's width. On an app's page, where you
   * comment on and pick parts of the app beside it. Not on the grid, where the
   * rail and the grid would be squeezed to make room for nothing: there it
   * overlays, as the popover did.
   */
  reserveSpace: boolean;
}

/**
 * The feedback drawer (review 2026-10-05: "the floating button opens a drawer").
 *
 * Built from the two drawers this prototype already had:
 * - Wide is production's Wider mode unchanged: `.overlayWide` (scrim, full
 *   height, two-column form) and `.modalContainerWide` (min(1120px, 80vw)).
 * - Narrow is the comments drawer: production `Drawer`'s container and its
 *   300ms slide, without the overlay. It is non-modal because both things you
 *   do beside it act on the page — Pick a part drags over the app, and comment
 *   mode clicks on it — so instead of covering the page the shell gives up the
 *   drawer's width (`--feedback-drawer-inset`, read by the prototype shell at
 *   ≥960). Below 960 it overlays; on a phone it is the whole screen.
 *
 * While a capture is on screen the drawer is hidden but keeps its inset, so the
 * app does not jump under the crosshair.
 */
export function FeedbackDrawerFrame({ isOpen, wide, hidden, reserveSpace, children }: PropsWithChildren<FrameProps>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.documentElement.style.setProperty(INSET_VAR, isOpen && !wide && reserveSpace ? `${FEEDBACK_DRAWER_NARROW}px` : '0px');
  }, [isOpen, wide, reserveSpace]);
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty(INSET_VAR);
    },
    [],
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          key="feedback-drawer"
          className={clsx(dw.frame, wide && s.overlayWide, wide && dw.frameWide, hidden && s.overlayHidden)}
          // Our own chrome stays out of the prototype's native screenshots.
          {...{ [CAPTURE_IGNORE_ATTR]: '' }}
        >
          <motion.div
            className={clsx(
              dr.container,
              s.modalContainer,
              wide && s.modalContainerWide,
              dw.panel,
              wide ? dw.panelWide : dw.panelNarrow,
            )}
            role="dialog"
            aria-modal={wide}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export type DrawerTab = 'feedback' | 'comments';

interface SwitchProps {
  active: DrawerTab;
  /** Comments on the app, beside the Comments tab. */
  commentCount: number;
  onSelect: (tab: DrawerTab) => void;
}

/**
 * COPY of develop's `FeedbackTabs` (components/page/ai-apps/components/FeedbackTabs),
 * stylesheet imported verbatim: the segmented control production built for this
 * exact switch, then hid. Two changes: the second tab reads "Comments", since in
 * the drawer it holds the list of them, not one comment; and it heads the
 * drawer under its title rather than replacing the title.
 */
export function DrawerSwitch({ active, commentCount, onSelect }: SwitchProps) {
  return (
    <div className={tabs.root} role="tablist" aria-label="Feedback on this app">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'feedback'}
        className={clsx(tabs.tab, active === 'feedback' && tabs.active)}
        onClick={() => onSelect('feedback')}
      >
        Feedback
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === 'comments'}
        className={clsx(tabs.tab, active === 'comments' && tabs.active)}
        onClick={() => onSelect('comments')}
      >
        <CommentIcon />
        Comments
        {commentCount > 0 && <span className={tabs.count}>{commentCount}</span>}
      </button>
    </div>
  );
}
