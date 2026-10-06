'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon, CommentIcon } from '@/components/icons';
import {
  isAnyDialogOpen,
  isOpenFeedbackKey,
  isShortcutsKey,
  useShortcutLabels,
} from '@/components/page/ai-apps/shortcutKeys';
import type { AppCapture } from '@/components/page/ai-apps/components/element-pins/useElementPins';

// Production stylesheets, verbatim: the button, and the popover's card for the comment card.
import s from '@/components/page/ai-apps/components/FloatingFeedbackButton/FloatingFeedbackButton.module.scss';
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';

import { CAPTURE_IGNORE_ATTR } from '../threads/nativeCapture';
import { GiveAiAppFeedbackDialog, ShortcutHelp, type MockAppOption, type SubmittedFeedback } from './FeedbackDialog';
import local from './FeedbackDoors.module.scss';
import polish from './FeedbackPolish.module.scss';

/** How long the label stays before the pill settles to the glyph. */
const INTRO_MS = 2200;

interface Props {
  /** When provided (app detail page), preselects this app in the feedback picker. */
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
   * Comments on the live app (detail page). As in production with
   * `SHOW_AI_APPS_COMMENTS` on: the button is "Feedback & comments" and opens
   * one panel with two tabs — Feedback (this dialog) and Comment (comment mode,
   * drawn by the page). The resting mark carries the count.
   */
  commentMode?: {
    available: boolean;
    active: boolean;
    count: number;
    onOpen: () => void;
    onClose: () => void;
    /** Bumped by the page when the comment card's Feedback tab is chosen: open the dialog. */
    feedbackRequest: number;
  };
}

/**
 * COPY-SIMPLIFY of production `FloatingFeedbackButton` (develop, 2026-10-05),
 * with its comment-mode wiring switched on (production ships it behind
 * `SHOW_AI_APPS_COMMENTS = false`). Dropped: the rbac gate and the open-app
 * feedback switch (always visible here), analytics, and the bridge pin flow
 * (`elementPins`, PinOverlay / PinPanel) — comment mode is the way to point at
 * something.
 *
 * One deliberate deviation: production's Feedback | Comment tabs (`FeedbackTabs`
 * in the dialog header, and on its `CommentCard`) are replaced by two full-size
 * doors, as review settled on the ai-apps-comments entry: "the tab switch to
 * comments make it hard to find and get back to the feedback section". The
 * form's first row is "Comment on the app"; comment mode's card is
 * "Commenting" with a full-width "Back to feedback".
 */
export function FloatingFeedbackButton(props: Props) {
  return <FeedbackFab key={props.appUid ?? 'list'} {...props} />;
}

function FeedbackFab({ appUid, appName, apps, viewer, onSubmit, iframeRef, capture, commentMode }: Props) {
  const commentsAvailable = Boolean(commentMode?.available);
  const inCommentMode = Boolean(commentMode?.available && commentMode.active);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const shortcuts = useShortcutLabels();

  // Paused while the feedback popover is open — collapsing the anchor mid-use
  // repositions the panel and closes the app picker.
  useEffect(() => {
    if (isOpen || isCollapsed) return;
    const timer = setTimeout(() => setIsCollapsed(true), INTRO_MS);
    return () => clearTimeout(timer);
  }, [isOpen, isCollapsed]);

  const startFeedback = useCallback(() => setIsOpen(true), []);

  const startCommenting = () => {
    setIsOpen(false);
    commentMode?.onOpen();
  };

  const backToFeedback = () => {
    commentMode?.onClose();
    setIsOpen(true);
  };

  /* The comment card's Feedback tab: the page bumps the request, the dialog opens. */
  const feedbackRequest = commentMode?.feedbackRequest ?? 0;
  const [seenFeedbackRequest, setSeenFeedbackRequest] = useState(feedbackRequest);
  if (feedbackRequest !== seenFeedbackRequest) {
    setSeenFeedbackRequest(feedbackRequest);
    setIsOpen(true);
  }

  /* One mark, one panel: pressed again it closes whichever tab is open. */
  const onButton = () => {
    if (inCommentMode) {
      commentMode?.onClose();
      return;
    }
    if (commentsAvailable && isOpen) {
      setIsOpen(false);
      return;
    }
    startFeedback();
  };

  /* The open form owns its keys, `?` included. */
  useEffect(() => {
    if (isOpen || shortcutsOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (isShortcutsKey(event) && !isAnyDialogOpen()) {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (!isOpenFeedbackKey(event)) return;
      event.preventDefault();
      /* What the button does while the form is closed. */
      if (inCommentMode) commentMode?.onClose();
      else startFeedback();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, shortcutsOpen, inCommentMode, commentMode, startFeedback]);

  const panelOpen = inCommentMode || (commentsAvailable && isOpen);
  const name = commentsAvailable ? 'Feedback & comments' : 'Give feedback';

  return (
    <>
      <div
        ref={wrapRef}
        // Polish: on a phone the open form covers the screen, and this button sat on its Send.
        className={clsx(s.wrap, isOpen && polish.fabOpen)}
        data-collapsed={isCollapsed || panelOpen}
        // Our own chrome stays out of the prototype's native screenshots.
        {...{ [CAPTURE_IGNORE_ATTR]: '' }}
      >
        <button
          type="button"
          className={clsx(s.button, panelOpen && s.buttonActive)}
          aria-label={panelOpen ? 'Close feedback and comments' : name}
          aria-expanded={commentsAvailable ? panelOpen : undefined}
          aria-keyshortcuts={shortcuts.openAria}
          onClick={onButton}
        >
          <CommentIcon />
          <span className={s.label} aria-hidden>
            <span>{name}</span>
            <kbd className={s.labelKbd}>{shortcuts.open}</kbd>
          </span>
          {commentsAvailable && !panelOpen && (commentMode?.count ?? 0) > 0 && (
            <span className={s.count} aria-label={`${commentMode?.count} comments`}>
              {commentMode?.count}
            </span>
          )}
        </button>
      </div>

      <GiveAiAppFeedbackDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        apps={apps}
        viewer={viewer}
        onSubmit={onSubmit}
        appUid={appUid}
        appName={appName}
        anchorRef={wrapRef}
        placement="above"
        capture={capture}
        frameRef={iframeRef}
        topSlot={
          commentsAvailable ? (
            <button type="button" className={local.commentDoor} onClick={startCommenting}>
              <span className={local.commentDoorIcon} aria-hidden>
                <CommentIcon />
              </span>
              <span className={local.commentDoorText}>
                <span className={local.commentDoorTitle}>
                  Comment on the app
                  {(commentMode?.count ?? 0) > 0 && (
                    <span className={local.commentDoorCount}>{commentMode?.count}</span>
                  )}
                </span>
                <span className={local.commentDoorSub}>Click any spot to leave a comment right there</span>
              </span>
              <ChevronIcon />
            </button>
          ) : undefined
        }
      />

      {/* Comment mode: the form shrinks to this card in the same corner, with a full-size way back. */}
      {inCommentMode && (
        <div className={clsx(fd.root, local.commentCard)} role="status" {...{ [CAPTURE_IGNORE_ATTR]: '' }}>
          <div className={clsx(fd.header, local.commentHead)}>
            <h2 className={clsx(fd.title, local.commentTitle)}>Commenting</h2>
            <button type="button" className={fd.closeButton} onClick={commentMode?.onClose} aria-label="Stop commenting">
              <CloseIcon width={16} height={16} />
            </button>
          </div>
          <p className={local.commentHint}>Click anywhere on the app to leave a comment.</p>
          <p className={local.commentAudience}>Everyone who can open this app can see it.</p>
          <div className={local.commentFoot}>
            <Button style="border" variant="neutral" size="s" className={local.backButton} onClick={backToFeedback}>
              <BackIcon />
              Back to feedback
            </Button>
          </div>
        </div>
      )}

      <ShortcutHelp isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} shortcuts={shortcuts} />
    </>
  );
}

/* Same 16px / 1.4 stroke family as the dialog's camera glyph. */
function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={local.commentDoorChevron}>
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10 3.5 5.5 8 10 12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
