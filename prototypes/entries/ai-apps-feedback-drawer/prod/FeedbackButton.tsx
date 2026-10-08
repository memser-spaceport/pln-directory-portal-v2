'use client';

import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { CommentIcon } from '@/components/icons';
import {
  isAnyDialogOpen,
  isOpenFeedbackKey,
  isShortcutsKey,
  useShortcutLabels,
} from '@/components/page/ai-apps/shortcutKeys';
import type { AppCapture } from '@/components/page/ai-apps/components/element-pins/useElementPins';

// Production stylesheet, verbatim.
import s from '@/components/page/ai-apps/components/FloatingFeedbackButton/FloatingFeedbackButton.module.scss';

import { CAPTURE_IGNORE_ATTR } from '../threads/nativeCapture';
import { GiveAiAppFeedbackDialog, ShortcutHelp, type MockAppOption, type SubmittedFeedback } from './FeedbackDialog';
import { DrawerSwitch, type DrawerTab } from './FeedbackDrawer';
import dw from './FeedbackDrawer.module.scss';
import polish from './FeedbackPolish.module.scss';

/** How long the label stays before the pill settles to the glyph. */
const INTRO_MS = 2200;

interface Props {
  /** When provided (app detail page), the drawer is about this app: it is named, not picked. */
  appUid?: string;
  appName?: string;
  /** Mock data the dialog needs (production reads these from its hooks). */
  apps: MockAppOption[];
  viewer?: { uid: string; name: string; email?: string };
  onSubmit?: (feedback: SubmittedFeedback) => void;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  /** Instant screenshots: a picture of the app with no screen-share prompt (production: the bridge). */
  capture?: () => Promise<AppCapture>;
  /**
   * Comments on the live app (detail page). The drawer gets a Feedback |
   * Comments switch; Comments turns comment mode on (drawn by the page) and
   * shows `body`, the list of threads.
   */
  commentMode?: {
    available: boolean;
    active: boolean;
    count: number;
    onOpen: () => void;
    onClose: () => void;
    /** The Comments tab: the thread list, drawn by the page. */
    body: ReactNode;
    /** Phone: the drawer steps aside while a comment is placed on the app (the page draws its bar). */
    collapsed?: boolean;
    /** Bumped by the page when comment mode asks the whole drawer to close (Esc with nothing open). */
    closeRequest: number;
  };
}

/**
 * COPY-SIMPLIFY of production `FloatingFeedbackButton` (develop, 2026-10-05).
 * Dropped: the rbac gate and the open-app feedback switch (always visible here),
 * analytics, and the bridge pin flow (comment mode is the way to point at
 * something).
 *
 * Drawer iteration (review 2026-10-05): the button opens a drawer on the right,
 * not the popover above it, and steps aside while the drawer is open (✕ or Esc
 * brings it back). On an app's page the drawer leads with a Feedback | Comments
 * switch — production's own segmented control (`FeedbackTabs`), under the
 * title, not in the app header and not as two buttons. Feedback is the form;
 * Comments turns comment mode on and lists the threads, so the earlier
 * "Comment on the app" row and the "Commenting" card with Back to feedback are
 * gone: the switch is the way there and the way back.
 */
export function FloatingFeedbackButton(props: Props) {
  return <FeedbackFab key={props.appUid ?? 'list'} {...props} />;
}

function FeedbackFab({ appUid, appName, apps, viewer, onSubmit, iframeRef, capture, commentMode }: Props) {
  const commentsAvailable = Boolean(commentMode?.available);
  const commenting = Boolean(commentMode?.available && commentMode.active);
  const [isOpen, setIsOpen] = useState(false);
  /* Comment mode is the drawer's Comments tab, so it holds the drawer open too. */
  const drawerOpen = isOpen || commenting;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const shortcuts = useShortcutLabels();

  // Paused while the drawer is open.
  useEffect(() => {
    if (drawerOpen || isCollapsed) return;
    const timer = setTimeout(() => setIsCollapsed(true), INTRO_MS);
    return () => clearTimeout(timer);
  }, [drawerOpen, isCollapsed]);

  const openDrawer = useCallback(() => setIsOpen(true), []);

  const closeDrawer = () => {
    setIsOpen(false);
    if (commenting) commentMode?.onClose();
  };

  /* The switch. The drawer stays open either way; only what fills it changes. */
  const selectTab = (tab: DrawerTab) => {
    setIsOpen(true);
    if (tab === 'comments') commentMode?.onOpen();
    else commentMode?.onClose();
  };

  /* Comment mode's Esc with nothing left to dismiss closes the whole drawer. */
  const closeRequest = commentMode?.closeRequest ?? 0;
  const [seenCloseRequest, setSeenCloseRequest] = useState(closeRequest);
  if (closeRequest !== seenCloseRequest) {
    setSeenCloseRequest(closeRequest);
    setIsOpen(false);
  }

  /* While the drawer is closed: F opens it, ? opens the shortcuts sheet. The open form owns its keys. */
  useEffect(() => {
    if (drawerOpen || shortcutsOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (isShortcutsKey(event) && !isAnyDialogOpen()) {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (!isOpenFeedbackKey(event)) return;
      event.preventDefault();
      openDrawer();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, shortcutsOpen, openDrawer]);

  const name = commentsAvailable ? 'Feedback & comments' : 'Give feedback';

  return (
    <>
      <div
        className={clsx(s.wrap, drawerOpen && dw.fabHidden)}
        data-collapsed={isCollapsed || drawerOpen}
        aria-hidden={drawerOpen || undefined}
        // Our own chrome stays out of the prototype's native screenshots.
        {...{ [CAPTURE_IGNORE_ATTR]: '' }}
      >
        <button
          type="button"
          className={s.button}
          aria-label={name}
          aria-keyshortcuts={shortcuts.openAria}
          tabIndex={drawerOpen ? -1 : undefined}
          onClick={openDrawer}
        >
          <CommentIcon />
          <span className={s.label} aria-hidden>
            <span>{name}</span>
            <kbd className={clsx(s.labelKbd, polish.hideOnPhone)}>{shortcuts.open}</kbd>
          </span>
          {commentsAvailable && (commentMode?.count ?? 0) > 0 && (
            <span className={s.count} aria-label={`${commentMode?.count} comments`}>
              {commentMode?.count}
            </span>
          )}
        </button>
      </div>

      <GiveAiAppFeedbackDialog
        variant="drawer"
        isOpen={drawerOpen}
        onClose={closeDrawer}
        apps={apps}
        viewer={viewer}
        onSubmit={onSubmit}
        appUid={appUid}
        appName={appName}
        capture={capture}
        frameRef={iframeRef}
        switchSlot={
          commentsAvailable ? (
            <DrawerSwitch
              active={commenting ? 'comments' : 'feedback'}
              commentCount={commentMode?.count ?? 0}
              onSelect={selectTab}
            />
          ) : undefined
        }
        altBody={commenting ? commentMode?.body : undefined}
        collapsed={commenting && Boolean(commentMode?.collapsed)}
      />

      <ShortcutHelp isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} shortcuts={shortcuts} />
    </>
  );
}
