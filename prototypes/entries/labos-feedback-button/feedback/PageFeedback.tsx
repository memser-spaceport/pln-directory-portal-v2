'use client';

import { useCallback, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { CommentIcon } from '@/components/icons';
import { isAnyDialogOpen, isOpenFeedbackKey, useShortcutLabels } from '@/components/page/ai-apps/shortcutKeys';
// Production's own LabOS-page capture: what the AI Apps list's feedback uses today.
import {
  capturePageViewport,
  FEEDBACK_CAPTURE_IGNORE_ATTR,
  scrollPage,
} from '@/components/page/ai-apps/components/screenshot-feedback/capturePage';

// Production stylesheet, verbatim.
import s from '@/components/page/ai-apps/components/FeedbackFabButton/FeedbackFabButton.module.scss';

import { GiveAiAppFeedbackDialog, type SubmittedFeedback } from './FeedbackDialog';
import dw from './FeedbackDrawer.module.scss';
import polish from './FeedbackPolish.module.scss';

/** How long the floating button says its name before it settles to the glyph (production's). */
const INTRO_MS = 2200;

export interface PageFeedbackViewer {
  uid: string;
  name: string;
  email?: string;
}

/**
 * One feedback drawer for a LabOS page: open state, the F shortcut, and the
 * AI Apps drawer itself on page terms (`page`, production's page capture and
 * viewport Pick a part). Both doors — the navbar button and the floating
 * button — open this one, so the tool is the same whichever wins.
 */
export function usePageFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  /* Production's open-feedback key (F, or its chord) works from anywhere on the page while the drawer is closed. */
  useEffect(() => {
    if (isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (!isOpenFeedbackKey(event) || isAnyDialogOpen()) return;
      event.preventDefault();
      setIsOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return { isOpen, open, close };
}

export function PageFeedbackDrawer({
  isOpen,
  onClose,
  page,
  viewer,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  page: { name: string; path: string };
  viewer?: PageFeedbackViewer;
  onSubmit?: (feedback: SubmittedFeedback) => void;
}) {
  return (
    <GiveAiAppFeedbackDialog
      variant="drawer"
      isOpen={isOpen}
      onClose={onClose}
      apps={[]}
      viewer={viewer}
      onSubmit={onSubmit}
      page={page}
      capture={capturePageViewport}
      pickViewport
      scrollApp={scrollPage}
    />
  );
}

/**
 * COPY-SIMPLIFY of production `FloatingFeedbackButton` (as the AI Apps drawer
 * prototype has it): the brand pill bottom-right that says "Give feedback" on
 * arrival, then settles to the glyph, and steps aside while the drawer is open.
 * No comment count — LabOS pages take feedback, not comments.
 */
export function FloatingPageFeedbackButton({ isOpen, onOpen }: { isOpen: boolean; onOpen: () => void }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const shortcuts = useShortcutLabels();

  useEffect(() => {
    if (isOpen || isCollapsed) return;
    const timer = setTimeout(() => setIsCollapsed(true), INTRO_MS);
    return () => clearTimeout(timer);
  }, [isOpen, isCollapsed]);

  return (
    <div
      className={clsx(s.wrap, isOpen && dw.fabHidden)}
      data-collapsed={isCollapsed || isOpen}
      aria-hidden={isOpen || undefined}
      // The button stays out of the page's own screenshot.
      {...{ [FEEDBACK_CAPTURE_IGNORE_ATTR]: '', 'data-native-capture-ignore': '' }}
    >
      <button
        type="button"
        className={s.button}
        aria-label="Give feedback"
        aria-keyshortcuts={shortcuts.openAria}
        tabIndex={isOpen ? -1 : undefined}
        onClick={onOpen}
      >
        <CommentIcon />
        <span className={s.label} aria-hidden>
          <span>Give feedback</span>
          <kbd className={clsx(s.labelKbd, polish.hideOnPhone)}>{shortcuts.open}</kbd>
        </span>
      </button>
    </div>
  );
}
