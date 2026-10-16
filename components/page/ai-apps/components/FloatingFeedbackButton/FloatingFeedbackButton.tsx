'use client';

import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { SHOW_AI_APPS_COMMENTS } from '@/services/ai-apps/constants';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { CommentIcon } from '@/components/icons';
import {
  isAnyDialogOpen,
  isOpenFeedbackKey,
  isShortcutsKey,
  useShortcutLabels,
} from '@/components/page/ai-apps/shortcutKeys';
import { scheduleFontCache } from '@/ai-apps-bridge/font-cache';
import { capturePageViewport, FEEDBACK_CAPTURE_IGNORE_ATTR, scrollPage } from '../screenshot-feedback/capturePage';
import { GiveAiAppFeedbackDialog, ShortcutHelp } from '../GiveAiAppFeedbackDialog';
import { FeedbackTabs, type FeedbackTab } from '../FeedbackTabs/FeedbackTabs';
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
   * available, the button is "Feedback & comments": its drawer has a
   * Feedback | Comments switcher under the title (prototype
   * ai-apps-feedback-drawer) — Feedback, the written form, and Comments, which
   * turns comment mode on and lists the threads in the drawer body. The resting
   * mark carries the count of comments (all of them, as the list does).
   */
  commentMode?: {
    available: boolean;
    /** The Comments tab is open (comment mode on). */
    active: boolean;
    count: number;
    /** The Comments tab was chosen. */
    onOpen: () => void;
    /** Leave comment mode (the Feedback tab, or the drawer closed). */
    onClose: () => void;
    /** The Comments tab's body: the thread list, drawn by the page. */
    body: ReactNode;
    /** Bumped by the page when comment mode asks the whole drawer to close (Esc with nothing open). */
    closeRequest: number;
    /** Phone: the drawer steps aside while a comment is placed on the app (the page draws its bar). */
    collapsed?: boolean;
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
  /* The list has no app frame. A picture of this page replaces the screen-share prompt. */
  const isListSurface = !appUid && !iframeRef;
  const inCommentMode = Boolean(commentMode?.available && commentMode.active);
  const [isOpen, setIsOpen] = useState(false);
  const [isPinMode, setIsPinMode] = useState(false);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const canPin = SHOW_AI_APPS_COMMENTS && Boolean(appUid && elementPins?.status === 'ready');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  /* The form hid itself for a capture: the button steps out of the picture with it. */
  const [isFormHidden, setIsFormHidden] = useState(false);
  const introStartedAtRef = useRef<number | null>(null);
  const analytics = useAiAppsAnalytics();
  const shortcuts = useShortcutLabels();
  const { permsSet, isLoading } = usePermissions();
  const isVisible = !isLoading && canViewAiApps(permsSet) && feedbackEnabled;

  /* The list page draws its own picture. Fetch its fonts while idle, before Give feedback. */
  useEffect(() => {
    if (!isListSurface || !isVisible) return;
    return scheduleFontCache();
  }, [isListSurface, isVisible]);

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

  // Paused while the feedback drawer is open: the label is spent on arrival, not behind the drawer.
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

  /* Today's door, minus the comment mode: pin mode when the bridge answered, the drawer otherwise. */
  const startFeedback = useCallback(() => {
    if (canPin && !commentsAvailable) {
      openPinMode();
      return;
    }
    analytics.onFeedbackDialogOpened(appUid ? { appUid, appName } : {});
    setIsOpen(true);
  }, [canPin, commentsAvailable, openPinMode, analytics, appUid, appName]);

  /* Comment mode's Esc with nothing left to dismiss: the page bumps the request, the whole drawer closes.
     Only a bump while comments are on counts: comments dropping out (bridge, frame, setup card) takes the
     prop away, and reading that as 0 — or its return as a new value — would close a drawer mid-typing. */
  const closeRequest = commentMode?.closeRequest;
  const [seenCloseRequest, setSeenCloseRequest] = useState(closeRequest);
  if (closeRequest !== undefined && closeRequest !== seenCloseRequest) {
    setSeenCloseRequest(closeRequest);
    if (seenCloseRequest !== undefined) setIsOpen(false);
  }

  /* Comment mode is the drawer's Comments tab, so it holds the drawer open too. */
  const drawerOpen = isOpen || inCommentMode;

  const closeDrawer = () => {
    /* Closing the drawer (Cancel, ✕, Close after sending) ends the pin session and comment mode too. */
    elementPins?.clearPins();
    setIsOpen(false);
    if (inCommentMode) commentMode?.onClose();
  };

  /* The switcher. The drawer stays open either way; only what fills it changes. */
  const selectTab = (tab: FeedbackTab) => {
    setIsOpen(true);
    if (tab === 'comment') {
      if (inCommentMode) return;
      if (appUid) analytics.onFeedbackCommentsTabClicked({ appUid });
      commentMode?.onOpen();
    } else if (inCommentMode) {
      commentMode?.onClose();
    }
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

  /* The open drawer owns its keys, `?` included. */
  useEffect(() => {
    if (!isVisible || drawerOpen || isPinMode || shortcutsOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (isShortcutsKey(event) && !isAnyDialogOpen()) {
        event.preventDefault();
        analytics.onFeedbackShortcutsHelpOpened();
        setShortcutsOpen(true);
        return;
      }
      if (!isOpenFeedbackKey(event)) return;
      event.preventDefault();
      analytics.onFeedbackShortcutUsed({ action: 'open' });
      /* What the button does while the drawer is closed. */
      startFeedback();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible, drawerOpen, isPinMode, shortcutsOpen, startFeedback, analytics]);

  if (!isVisible) {
    return null;
  }

  const name = commentsAvailable ? 'Feedback & comments' : 'Give feedback';

  return (
    <>
      {/* The button steps aside while its drawer is open, at every width; ✕ and Esc bring it back. */}
      <div
        {...{ [FEEDBACK_CAPTURE_IGNORE_ATTR]: '' }}
        className={clsx(s.wrap, isFormHidden && s.wrapHidden, drawerOpen && s.fabHidden)}
        data-collapsed={isCollapsed || drawerOpen}
        aria-hidden={drawerOpen || undefined}
      >
        <button
          type="button"
          className={s.button}
          aria-label={name}
          aria-keyshortcuts={shortcuts.openAria}
          tabIndex={drawerOpen ? -1 : undefined}
          onClick={startFeedback}
        >
          {/* CommentIcon hardcodes its own 16px box and ignores props. */}
          <CommentIcon />
          <span className={s.label} aria-hidden>
            <span>{name}</span>
            <kbd className={s.labelKbd}>{shortcuts.open}</kbd>
          </span>
          {commentsAvailable && (commentMode?.count ?? 0) > 0 && (
            <span className={s.count} aria-label={`${commentMode?.count} comments`}>
              {commentMode?.count}
            </span>
          )}
        </button>
      </div>

      {/* Out of the picture during a capture too: the screen share grabs whatever is on screen. */}
      {/* Not in comment mode: there the pins are comment mode's own, drawn by the page. */}
      {elementPins &&
        iframeRef &&
        elementPins.pins.length > 0 &&
        (isPinMode || (isOpen && !inCommentMode)) &&
        !isFormHidden && (
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
        variant="drawer"
        isOpen={drawerOpen}
        onClose={closeDrawer}
        /* Pins belong to comment mode when it is there; the old pin flow feeds the dialog otherwise. */
        pins={commentsAvailable ? undefined : elementPins?.pins}
        onSent={() => elementPins?.clearPins()}
        onEditPins={
          elementPins && !commentsAvailable
            ? () => {
                setIsOpen(false);
                setIsPinMode(true);
              }
            : undefined
        }
        getContext={getContext}
        appUid={appUid}
        appName={appName}
        /* Instant screenshots: the app's bridge, or a picture of this page on the list. */
        capture={elementPins?.canCapture ? elementPins.capture : isListSurface ? capturePageViewport : undefined}
        /* Pick a part's layer covers the page: the wheel reaches the app through its bridge, or scrolls this window. */
        scrollApp={elementPins?.canScroll ? elementPins.scrollApp : isListSurface ? scrollPage : undefined}
        pickViewport={isListSurface}
        /* The bridge never answered: an app built before it (kit < 1.15). */
        bridgeMissing={elementPins?.status === 'unavailable'}
        /* Its bridge may still answer (a slow frame on a phone): the automatic screenshot waits for it. */
        captureExpected={Boolean(elementPins) && elementPins?.status !== 'off'}
        frameRef={iframeRef}
        onHiddenChange={setIsFormHidden}
        switchSlot={
          commentsAvailable ? (
            <FeedbackTabs
              active={inCommentMode ? 'comment' : 'feedback'}
              commentCount={commentMode?.count ?? 0}
              onSelect={selectTab}
            />
          ) : undefined
        }
        altBody={inCommentMode ? commentMode?.body : undefined}
        collapsed={inCommentMode && Boolean(commentMode?.collapsed)}
      />

      <ShortcutHelp isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} shortcuts={shortcuts} />
    </>
  );
}
