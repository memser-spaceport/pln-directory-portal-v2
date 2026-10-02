'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { CommentIcon } from '@/components/icons';
import { isOpenFeedbackChord, useShortcutLabels } from '@/components/page/ai-apps/shortcutKeys';
import { GiveAiAppFeedbackDialog, type FeedbackDialogHandle } from '../GiveAiAppFeedbackDialog';
import { FeedbackTabs } from '../FeedbackTabs/FeedbackTabs';
import { PinOverlay, PinPanel, type ElementPinsController } from '../element-pins';
import type { FeedbackContext } from '@/services/ai-app-feedback/ai-app-feedback.service';

import s from './FloatingFeedbackButton.module.scss';

/** How long the label stays before the pill settles to the glyph. */
const INTRO_MS = 2200;

interface Props {
  /** When provided (app detail page), preselects this app in the feedback picker. */
  appUid?: string;
  appName?: string;
  /**
   * Open-app LabOS feedback. The list page omits this and always shows the
   * button. A missing value is on, matching the server default.
   */
  feedbackEnabled?: boolean;
  /**
   * Element pins for the embedded app (detail page, flag on). When its bridge
   * has said `ready`, the button opens pin mode instead of the dialog; an app
   * without the bridge keeps the screenshot flow.
   */
  elementPins?: ElementPinsController;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  /** Where the feedback is left (detail page); passed through to the dialog. */
  getContext?: () => FeedbackContext | null;
  /**
   * Comments on the live app (detail page, flag on, bridge can locate). When
   * available, the button is "Feedback & comments": it opens one panel with two
   * tabs (prototype ai-apps-comments) — Feedback, the written form (this
   * dialog), and Comment, where comment mode draws the card and the pins. The
   * resting mark carries the count of comments (all of them, as the panel does).
   */
  commentMode?: {
    available: boolean;
    /** The Comment tab is open (comment mode on). */
    active: boolean;
    count: number;
    /** The Comment tab was chosen. */
    onOpen: () => void;
    /** Leave comment mode (the button pressed again). */
    onClose: () => void;
    /** Bumped by the page when the comment card's Feedback tab is chosen: open the dialog. */
    feedbackRequest: number;
  };
}

/**
 * Floating "Give feedback" door for the AI Apps surfaces. It opens saying its
 * name, then settles into a 48px glyph in the bottom-right corner. After that,
 * a hover-capable pointer can expand the label again; on touch it stays the
 * glyph. The accessible name is always on the button.
 *
 * Why the label is temporary: on the detail page everything the control covers
 * belongs to the embedded app underneath, so the *resting* state has to be the
 * smallest mark that can still be found. The name is spent once on arrival,
 * then hover (and keyboard focus) can bring it back.
 */
export function FloatingFeedbackButton(props: Props) {
  // The introduction is a mount-time story, but the detail route is one client
  // component reading `use(params)`: React reconciles it at the same position
  // across an [id] change, so navigating app A -> app B re-renders instead of
  // remounting and the label would silently not replay. Keying here rather than
  // at the call sites keeps that from being something a caller can forget.
  return <FeedbackFab key={props.appUid ?? 'list'} {...props} />;
}

type SubmittedApp = { label: string; value: string };

function FeedbackFab({
  appUid,
  appName,
  feedbackEnabled = true,
  elementPins,
  iframeRef,
  getContext,
  commentMode,
}: Props) {
  const commentsAvailable = Boolean(commentMode?.available);
  const inCommentMode = Boolean(commentMode?.available && commentMode.active);
  const [isOpen, setIsOpen] = useState(false);
  const [isPinMode, setIsPinMode] = useState(false);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const canPin = Boolean(appUid && elementPins?.status === 'ready');
  const [isCollapsed, setIsCollapsed] = useState(false);
  /** App from the last successful send. The next open-shortcut consumes it. */
  const [reopenApp, setReopenApp] = useState<SubmittedApp | null>(null);
  /** Prefill for the open that the shortcut just started. A button click leaves this empty. */
  const [shortcutApp, setShortcutApp] = useState<SubmittedApp | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const introStartedAtRef = useRef<number | null>(null);
  const analytics = useAiAppsAnalytics();
  const shortcuts = useShortcutLabels();
  const { permsSet, isLoading } = usePermissions();
  const isVisible = !isLoading && canViewAiApps(permsSet) && feedbackEnabled;

  // Gated on `isVisible` rather than left bare: hooks run before the early
  // return below, so an ungated timer would spend its 2.2s while this renders
  // null and the label would never be seen.
  useEffect(() => {
    if (!isVisible) {
      introStartedAtRef.current = null;
      return;
    }

    introStartedAtRef.current = Date.now();
  }, [isVisible]);

  // Paused while the feedback popover is open — collapsing the anchor mid-use
  // repositions the panel and closes the app picker.
  useEffect(() => {
    if (!isVisible || isOpen || isCollapsed) {
      return;
    }

    const elapsed = introStartedAtRef.current ? Date.now() - introStartedAtRef.current : 0;
    const remaining = Math.max(0, INTRO_MS - elapsed);

    const timer = setTimeout(() => setIsCollapsed(true), remaining);
    return () => clearTimeout(timer);
  }, [isVisible, isOpen, isCollapsed]);

  /* The door: pin mode when the app's bridge answered, the dialog otherwise. */
  const openPinMode = useCallback(() => {
    if (!elementPins || !appUid) return;
    analytics.onFeedbackPinsOpened({ appUid });
    setIsPinMode(true);
    if (elementPins.pins.length === 0) elementPins.startPicking();
  }, [elementPins, appUid, analytics]);

  /* Today's door, minus the comment mode: pin mode when the bridge answered, the dialog otherwise. */
  const startFeedback = useCallback(() => {
    if (canPin && !commentsAvailable) {
      openPinMode();
      return;
    }
    setShortcutApp(null);
    analytics.onFeedbackDialogOpened(appUid ? { appUid, appName } : {});
    setIsOpen(true);
  }, [canPin, commentsAvailable, openPinMode, analytics, appUid, appName]);

  /* The comment card's Feedback tab: the page bumps the request, the dialog opens. */
  const feedbackRequest = commentMode?.feedbackRequest ?? 0;
  const [seenFeedbackRequest, setSeenFeedbackRequest] = useState(feedbackRequest);
  if (feedbackRequest !== seenFeedbackRequest) {
    setSeenFeedbackRequest(feedbackRequest);
    setShortcutApp(null);
    setIsOpen(true);
  }

  /* The form warns before throwing away what was written or drawn; closing it from here asks it first. */
  const dialogRef = useRef<FeedbackDialogHandle>(null);
  const closeForm = (close: () => void) => {
    if (dialogRef.current) dialogRef.current.requestClose(close);
    else close();
  };

  /* One mark, one panel: pressed again it closes whichever tab is open. */
  const onButton = () => {
    if (inCommentMode) {
      commentMode?.onClose();
      return;
    }
    if (commentsAvailable && isOpen) {
      closeForm(() => setIsOpen(false));
      return;
    }
    startFeedback();
  };

  const leavePinMode = () => {
    setIsPinMode(false);
    setActivePinId(null);
  };

  /* A pin made in a frame that has since been remounted (redeploy) or lost its
     bridge can't be shown or sent; drop pin mode with it. */
  const bridgeStatus = elementPins?.status;
  const [seenBridgeStatus, setSeenBridgeStatus] = useState(bridgeStatus);
  if (seenBridgeStatus !== bridgeStatus) {
    setSeenBridgeStatus(bridgeStatus);
    if (bridgeStatus !== 'ready') {
      setIsPinMode(false);
      setActivePinId(null);
    }
  }

  useEffect(() => {
    if (!isVisible || isOpen || isPinMode) return;

    const onKey = (event: KeyboardEvent) => {
      if (!isOpenFeedbackChord(event)) return;
      event.preventDefault();
      analytics.onFeedbackShortcutUsed({ action: 'open' });
      if (inCommentMode) {
        commentMode?.onClose();
        return;
      }
      if (canPin && !commentsAvailable && !reopenApp) {
        openPinMode();
        return;
      }
      const prefill = reopenApp;
      setShortcutApp(prefill);
      setReopenApp(null);
      const uid = prefill?.value ?? appUid;
      const name = prefill?.label ?? appName;
      analytics.onFeedbackDialogOpened(uid ? { appUid: uid, appName: name } : {});
      setIsOpen(true);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    isVisible,
    isOpen,
    isPinMode,
    canPin,
    commentsAvailable,
    inCommentMode,
    openPinMode,
    reopenApp,
    appUid,
    appName,
    analytics,
    commentMode,
  ]);

  if (!isVisible) {
    return null;
  }

  const panelOpen = inCommentMode || (commentsAvailable && isOpen);
  const name = commentsAvailable ? 'Feedback & comments' : 'Give feedback';

  return (
    <>
      <div ref={wrapRef} className={s.wrap} data-collapsed={isCollapsed || panelOpen}>
        {/* With comments available the button opens one panel (Comment / Feedback)
            and, while it is open, settles to the outlined glyph that closes it.
            The count rides the resting mark only — in the mode the pins are the count. */}
        <button
          type="button"
          className={clsx(s.button, panelOpen && s.buttonActive)}
          aria-label={panelOpen ? 'Close feedback and comments' : name}
          aria-expanded={commentsAvailable ? panelOpen : undefined}
          aria-keyshortcuts={shortcuts.openAria}
          onClick={onButton}
        >
          {/* CommentIcon hardcodes its own 16px box and ignores props. */}
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

      {elementPins && iframeRef && elementPins.pins.length > 0 && (isPinMode || isOpen) && (
        <PinOverlay
          iframeRef={iframeRef}
          pins={elementPins.pins}
          activePinId={activePinId}
          onPinClick={(pinId) => {
            if (!isPinMode) openPinMode();
            setActivePinId(pinId);
          }}
        />
      )}

      {elementPins && isPinMode && (
        <PinPanel
          pins={elementPins}
          activePinId={activePinId}
          onActivePinChange={setActivePinId}
          onCancel={() => {
            elementPins.clearPins();
            leavePinMode();
          }}
          onUseScreenshot={() => {
            elementPins.clearPins();
            leavePinMode();
            setShortcutApp(null);
            analytics.onFeedbackDialogOpened(appUid ? { appUid, appName } : {});
            setIsOpen(true);
          }}
          onContinue={() => {
            elementPins.stopPicking();
            leavePinMode();
            analytics.onFeedbackDialogOpened(appUid ? { appUid, appName } : {});
            setIsOpen(true);
          }}
        />
      )}

      <GiveAiAppFeedbackDialog
        ref={dialogRef}
        isOpen={isOpen}
        onClose={() => {
          /* Closing the dialog (Cancel, ✕, or a successful send) ends the pin session too. */
          elementPins?.clearPins();
          setIsOpen(false);
        }}
        /* Pins belong to comment mode when it is there; the old pin flow feeds the dialog otherwise. */
        pins={commentsAvailable ? undefined : elementPins?.pins}
        onEditPins={
          elementPins && !commentsAvailable
            ? () => {
                setIsOpen(false);
                setIsPinMode(true);
              }
            : undefined
        }
        onSubmitted={setReopenApp}
        getContext={getContext}
        appUid={shortcutApp?.value ?? appUid}
        appName={shortcutApp?.label ?? appName}
        anchorRef={wrapRef}
        placement="above"
        /* Instant screenshots: the app's bridge takes the picture, no screen-share prompt. */
        capture={elementPins?.canCapture ? elementPins.capture : undefined}
        frameRef={iframeRef}
        headerTabs={
          commentsAvailable ? (
            <FeedbackTabs
              active="feedback"
              commentCount={commentMode?.count ?? 0}
              onSelect={(tab) => {
                if (tab !== 'comment') return;
                closeForm(() => {
                  setIsOpen(false);
                  commentMode?.onOpen();
                });
              }}
            />
          ) : undefined
        }
      />
    </>
  );
}
