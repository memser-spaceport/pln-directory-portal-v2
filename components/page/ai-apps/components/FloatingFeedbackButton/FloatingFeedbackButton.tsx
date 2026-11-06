'use client';

import { type ReactNode, type RefObject, useCallback, useEffect, useState } from 'react';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { SHOW_AI_APPS_COMMENTS } from '@/services/ai-apps/constants';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useShortcutLabels } from '@/components/page/ai-apps/shortcutKeys';
import { scheduleFontCache } from '@/ai-apps-bridge/font-cache';
import { capturePageViewport, scrollPage } from '../screenshot-feedback/capturePage';
import { GiveAiAppFeedbackDialog, ShortcutHelp } from '../GiveAiAppFeedbackDialog';
import { FeedbackTabs, type FeedbackTab } from '../FeedbackTabs/FeedbackTabs';
import { PinOverlay, PinPanel, type ElementPinsController } from '../element-pins';
import type { FeedbackContext } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { useFeedbackShortcuts } from '../../hooks/useFeedbackShortcuts';
import { FeedbackFabButton } from '../FeedbackFabButton';
import { usePinSession } from './hooks/usePinSession';

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

/** The AI Apps feedback door: the floating button, plus pins and comments on the app detail page. */
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
  const canPin = SHOW_AI_APPS_COMMENTS && Boolean(appUid && elementPins?.status === 'ready');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  /* The form hid itself for a capture: the button steps out of the picture with it. */
  const [isFormHidden, setIsFormHidden] = useState(false);
  const analytics = useAiAppsAnalytics();
  const shortcuts = useShortcutLabels();
  const { permsSet, isLoading } = usePermissions();
  const isVisible = !isLoading && canViewAiApps(permsSet) && feedbackEnabled;
  const { isPinMode, activePinId, setActivePinId, openPinMode, leavePinMode, resumePinMode } = usePinSession(
    elementPins,
    appUid,
  );

  /* The list page draws its own picture. Fetch its fonts while idle, before Give feedback. */
  useEffect(() => {
    if (!isListSurface || !isVisible) {
      return;
    }
    return scheduleFontCache();
  }, [isListSurface, isVisible]);

  const openFeedbackDialog = useCallback(() => {
    analytics.onFeedbackDialogOpened(appUid ? { appUid, appName } : {});
    setIsOpen(true);
  }, [analytics, appUid, appName]);

  /* The door: pin mode when the app's bridge answered and there is no comment mode, the drawer otherwise. */
  const startFeedback = useCallback(() => {
    if (canPin && !commentsAvailable) {
      openPinMode();
      return;
    }
    openFeedbackDialog();
  }, [canPin, commentsAvailable, openPinMode, openFeedbackDialog]);

  /* Comment mode's Esc with nothing left to dismiss: the page bumps the request, the whole drawer closes.
     Only a bump while comments are on counts: comments dropping out (bridge, frame, setup card) takes the
     prop away, and reading that as 0 — or its return as a new value — would close a drawer mid-typing. */
  const closeRequest = commentMode?.closeRequest;
  const [seenCloseRequest, setSeenCloseRequest] = useState(closeRequest);
  if (closeRequest !== undefined && closeRequest !== seenCloseRequest) {
    setSeenCloseRequest(closeRequest);
    if (seenCloseRequest !== undefined) {
      setIsOpen(false);
    }
  }

  /* Comment mode is the drawer's Comments tab, so it holds the drawer open too. */
  const drawerOpen = isOpen || inCommentMode;

  const closeDrawer = () => {
    /* Closing the drawer (Cancel, ✕, Close after sending) ends the pin session and comment mode too. */
    elementPins?.clearPins();
    setIsOpen(false);
    if (inCommentMode) {
      commentMode?.onClose();
    }
  };

  /* The switcher. The drawer stays open either way; only what fills it changes. */
  const selectTab = (tab: FeedbackTab) => {
    setIsOpen(true);
    if (tab === 'comment') {
      if (inCommentMode) {
        return;
      }
      if (appUid) {
        analytics.onFeedbackCommentsTabClicked({ appUid });
      }
      commentMode?.onOpen();
    } else if (inCommentMode) {
      commentMode?.onClose();
    }
  };

  const onOpenKey = useCallback(() => {
    analytics.onFeedbackShortcutUsed({ action: 'open' });
    startFeedback();
  }, [analytics, startFeedback]);

  const onShortcutsKey = useCallback(() => {
    analytics.onFeedbackShortcutsHelpOpened();
    setShortcutsOpen(true);
  }, [analytics]);

  /* The open drawer owns its keys, `?` included. */
  useFeedbackShortcuts({
    isEnabled: isVisible && !drawerOpen && !isPinMode && !shortcutsOpen,
    onOpenKey,
    onShortcutsKey,
  });

  if (!isVisible) {
    return null;
  }

  const name = commentsAvailable ? 'Feedback & comments' : 'Give feedback';

  return (
    <>
      <FeedbackFabButton
        name={name}
        isDrawerOpen={drawerOpen}
        isHidden={isFormHidden}
        onClick={startFeedback}
        count={commentsAvailable ? commentMode?.count : undefined}
      />

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
              if (!isPinMode) {
                openPinMode();
              }
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
            openFeedbackDialog();
          }}
          onContinue={() => {
            elementPins.stopPicking();
            leavePinMode();
            openFeedbackDialog();
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
                resumePinMode();
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
