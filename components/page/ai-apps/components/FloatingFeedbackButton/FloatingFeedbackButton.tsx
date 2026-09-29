'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { CommentIcon } from '@/components/icons';
import { isOpenFeedbackChord, useShortcutLabels } from '@/components/page/ai-apps/shortcutKeys';
import { GiveAiAppFeedbackDialog } from '../GiveAiAppFeedbackDialog';
import { PinOverlay, PinPanel, type ElementPinsController } from '../element-pins';

import s from './FloatingFeedbackButton.module.scss';

/** How long the label stays before the pill settles to the glyph. */
const INTRO_MS = 2200;

interface Props {
  /** When provided (app detail page), preselects this app in the feedback picker. */
  appUid?: string;
  appName?: string;
  /**
   * Element pins for the embedded app (detail page, flag on). When its bridge
   * has said `ready`, the button opens pin mode instead of the dialog; an app
   * without the bridge keeps the screenshot flow.
   */
  elementPins?: ElementPinsController;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
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

function FeedbackFab({ appUid, appName, elementPins, iframeRef }: Props) {
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
  const isVisible = !isLoading && canViewAiApps(permsSet);

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
      if (canPin && !reopenApp) {
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
  }, [isVisible, isOpen, isPinMode, canPin, openPinMode, reopenApp, appUid, appName, analytics]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div ref={wrapRef} className={s.wrap} data-collapsed={isCollapsed}>
        <button
          type="button"
          className={s.button}
          aria-label="Give feedback"
          aria-keyshortcuts={shortcuts.openAria}
          onClick={() => {
            if (canPin) {
              openPinMode();
              return;
            }
            setShortcutApp(null);
            analytics.onFeedbackDialogOpened(appUid ? { appUid, appName } : {});
            setIsOpen(true);
          }}
        >
          {/* CommentIcon hardcodes its own 16px box and ignores props. */}
          <CommentIcon />
          <span className={s.label} aria-hidden>
            <span>Give feedback</span>
            <kbd className={s.labelKbd}>{shortcuts.open}</kbd>
          </span>
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
        isOpen={isOpen}
        onClose={() => {
          /* Closing the dialog (Cancel, ✕, or a successful send) ends the pin session too. */
          elementPins?.clearPins();
          setIsOpen(false);
        }}
        pins={elementPins?.pins}
        onEditPins={
          elementPins
            ? () => {
                setIsOpen(false);
                setIsPinMode(true);
              }
            : undefined
        }
        onSubmitted={setReopenApp}
        appUid={shortcutApp?.value ?? appUid}
        appName={shortcutApp?.label ?? appName}
        anchorRef={wrapRef}
        placement="above"
      />
    </>
  );
}
