'use client';

import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import clsx from 'clsx';
import { useForm, FormProvider } from 'react-hook-form';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { ConfirmDialog } from '@/components/page/demo-day/FounderPendingView/components/ConfirmDialog';
import { FormEditor } from '@/components/form/FormEditor';
import { FormSelect } from '@/components/form/FormSelect/FormSelect';
import { CloseIcon, CommentIcon, PencilSimpleLineIcon } from '@/components/icons';
import { toast } from '@/components/core/ToastContainer';
import { useContactSupport } from '@/components/ContactSupport/hooks/useContactSupport';
import { useFormDraft } from '@/hooks/useFormDraft';
import { hostDataUriImages, isBlankHtml } from '@/utils/html';
import { useCurrentUserStore } from '@/services/auth/store';
import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';
import { useSubmitAiAppFeedback } from '@/services/ai-app-feedback/hooks/useSubmitAiAppFeedback';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import {
  isScreenshotChord,
  isSendChord,
  useShortcutLabels,
  type ShortcutLabels,
} from '@/components/page/ai-apps/shortcutKeys';
import {
  AnnotatorModal,
  AttachImageError,
  CaptureError,
  AnnotatedPreview,
  ConfirmLayer,
  LiveRegionOverlay,
  RegionSelectOverlay,
  appendScreenshots,
  attachImageFile,
  cropImageToDataUrl,
  emptyAnnotations,
  frameRectToCapturePixels,
  grabVideoFrame,
  hasAnyAnnotation,
  isCaptureSupported,
  isPersistentReason,
  requestTabCapture,
  stopCaptureStream,
  type AnnotationState,
  type FrameRect,
  type PersistentCaptureReason,
  type ScreenshotAttachment,
} from '../screenshot-feedback';
import type { AppCapture } from '../element-pins';
import { PinSummary, appendPinsHtml, hostPinCrops, toPinInputs, type ElementPin } from '../element-pins';
import type { FeedbackContext, FeedbackPinInput } from '@/services/ai-app-feedback/ai-app-feedback.service';

import s from './GiveAiAppFeedbackDialog.module.scss';

/** Visible characters the member may type, counted with the markup stripped. */
const MAX_LENGTH = 5000;
/** Screenshots per item. Each is a large picture; more is rarely clearer and risks the payload cap. */
export const MAX_SCREENSHOTS = 5;

/**
 * Serialized length the server will accept, mirroring `SubmitFeedbackSchema`'s
 * `.max(200000)` in the web-api.
 *
 * A second, larger cap is needed because `MAX_LENGTH` counts the one thing that
 * is never the problem. What fills a submission is the drawing: each annotated
 * screenshot carries its strokes in a `data-annotations` attribute as
 * URL-encoded JSON. Without this check the server rejects the request with
 * "String must contain at most 200000 character(s)" — a number about text the
 * member never wrote and cannot see.
 *
 * Kept slightly under the server's own limit so a request that passes here is
 * never refused there for a rounding difference in how the body is counted.
 */
const MAX_PAYLOAD = 199_000;
const FEEDBACK_TOOLBAR: (string | Record<string, unknown>)[][] = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'link', 'image'],
];
export const AI_APP_FEEDBACK_DRAFT_KEY = 'form-draft:ai-app-feedback';
export const FEEDBACK_PLACEHOLDER = 'What worked, what didn’t, and what would make this more useful?';

const SCREENSHOT_HINTS: Record<PersistentCaptureReason | 'open', string> = {
  open: 'Share this tab and drag to capture an area. You can draw and annotate on it.',
  unsupported: 'Screenshots need a desktop browser — take one on your device and attach it here.',
  blocked: 'Screen sharing is turned off in this browser — attach a screenshot instead.',
  unreadable: 'Your browser couldn’t read the screen — attach a screenshot instead.',
};

function hasFeedbackContent(html: string, attachmentCount = 0): boolean {
  return !isBlankHtml(html) || /<img\b/i.test(html) || attachmentCount > 0;
}

function visibleFeedbackLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').length;
}

export const LABOS_AI_APPS_OPTION = {
  label: 'LabOS - AI Apps',
  value: '__labos_ai_apps__',
} as const;

interface Option {
  label: string;
  value: string;
}

interface FormValues {
  app: Option | null;
  message: string;
}

type FeedbackDraft = {
  message: string;
};

const POPOVER_GAP = 8;

type Placement = 'below' | 'above';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Fired after a successful send, with the app that was submitted. */
  onSubmitted?: (app: Option) => void;
  /** When provided (app detail page), preselects this app in the picker. */
  appUid?: string;
  appName?: string;
  /** Positions the popover relative to this element. */
  anchorRef?: RefObject<HTMLElement | null>;
  /**
   * Which side of the anchor the panel opens on. 'above' is the floating
   * feedback button, which sits in the bottom-right corner — measuring down
   * from `rect.bottom` there would put the panel below the fold.
   */
  placement?: Placement;
  /** Element pins made in pin mode (app detail page, bridge-enabled apps). Sent with the feedback. */
  pins?: ElementPin[];
  /** Returns to the pin panel without discarding anything. */
  onEditPins?: () => void;
  /**
   * Where the feedback is being left (detail page): env, app path, the frame's
   * viewport, device, bridge. Read at submit time. Sent, with the pins as data,
   * only for feedback about the app on screen (`appUid`).
   */
  getContext?: () => FeedbackContext | null;
  /**
   * Replaces the "Give feedback" title: on an app whose page can take comments,
   * the dialog is the Feedback tab of one panel (Comment / Feedback).
   */
  headerTabs?: ReactNode;
  /**
   * A picture of the app on screen from its bridge — set when the app's bridge
   * can `capture`. With it the form attaches
   * one when it opens and offers Whole page / Pick a part with no screen-share
   * prompt; without it, today's screen share.
   */
  capture?: () => Promise<AppCapture>;
  /** The app frame, for Pick a part (the drag counts over it). */
  frameRef?: RefObject<HTMLIFrameElement | null>;
  /** For a host that closes the form itself (the button, the Comment tab): see `FeedbackDialogHandle`. */
  ref?: Ref<FeedbackDialogHandle>;
}

export type FeedbackDialogHandle = {
  /**
   * Close the form the way its own Cancel does: straight away when nothing
   * would be lost, else after "Discard your feedback?" is confirmed. `close`
   * runs once it may go (the host's own way of closing).
   */
  requestClose: (close: () => void) => void;
};

/**
 * This open's automatic screenshot. `landed` carries the picture from the
 * capture to the render that attaches it, so the "is it still wanted?" check
 * runs against the latest state rather than a closure.
 */
type AutoShot =
  | { token: number; status: 'capturing' | 'attached' | 'failed' | 'removed' }
  | { token: number; status: 'landed'; dataUrl: string };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read the capture'));
    image.src = src;
  });
}

const NO_PINS: ElementPin[] = [];

function getAnchorOverlayStyle(anchor: HTMLElement | null, placement: Placement): CSSProperties | undefined {
  if (!anchor) {
    return undefined;
  }

  const rect = anchor.getBoundingClientRect();
  const right = `${Math.max(12, window.innerWidth - rect.right)}px`;

  if (placement === 'above') {
    return {
      '--feedback-popover-bottom': `${window.innerHeight - rect.top + POPOVER_GAP}px`,
      '--feedback-popover-right': right,
    } as CSSProperties;
  }

  return {
    '--feedback-popover-top': `${rect.bottom + POPOVER_GAP}px`,
    '--feedback-popover-right': right,
  } as CSSProperties;
}

function getDefaultApp(appUid?: string, appName?: string): Option | null {
  if (!appUid || !appName) {
    return null;
  }

  return { label: appName, value: appUid };
}

export function GiveAiAppFeedbackDialog({
  isOpen,
  onClose,
  onSubmitted,
  appUid,
  appName,
  anchorRef,
  placement = 'below',
  pins = NO_PINS,
  onEditPins,
  getContext,
  headerTabs,
  capture,
  frameRef,
  ref,
}: Props) {
  const { currentUser } = useCurrentUserStore();
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties>();
  const { apps, isLoading: isAppsLoading } = useAiApps();
  const { mutate: submitAppFeedback, isPending: isAppFeedbackPending } = useSubmitAiAppFeedback();
  const { mutate: submitContactSupport, isPending: isContactSupportPending } = useContactSupport();
  const analytics = useAiAppsAnalytics();
  const shortcuts = useShortcutLabels();

  /* Apps whose creator turned feedback off refuse it (403), so they aren't offered — except the one on screen. */
  const appOptions: Option[] = [
    LABOS_AI_APPS_OPTION,
    ...apps
      .filter((app) => app.feedbackEnabled !== false || app.uid === appUid)
      .map((app) => ({ label: app.name, value: app.uid })),
  ];
  /* The new screenshot area (stacked previews, Whole page / Pick a part) is the flag's; the
     bridge decides only whether captures skip the screen share. */
  const canCapture = Boolean(capture);

  const getDefaults = useCallback(
    (): FormValues => ({ app: getDefaultApp(appUid, appName), message: '' }),
    [appUid, appName],
  );

  const methods = useForm<FormValues>({
    defaultValues: getDefaults(),
  });
  const { handleSubmit, reset, watch } = methods;
  const { clearDraft } = useFormDraft<FormValues, FeedbackDraft>({
    /* Per app, so reopening never restores text written about another app. */
    storageKey: appUid ? `${AI_APP_FEEDBACK_DRAFT_KEY}:${appUid}` : AI_APP_FEEDBACK_DRAFT_KEY,
    enabled: isOpen,
    methods,
    getDefaults,
    toDraft: (form) => ({ message: form.message }),
    fromDraft: (draft) => ({ ...getDefaults(), message: draft.message }),
    isEmpty: (draft) => !hasFeedbackContent(draft.message ?? ''),
  });
  const message = watch('message') ?? '';
  const isOverLimit = visibleFeedbackLength(message) > MAX_LENGTH;
  const [isHostingImages, setIsHostingImages] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotAttachment[]>([]);
  const [freezeSrc, setFreezeSrc] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  /**
   * Which capture the annotator is open on, when it is an edit.
   *
   * `null` for a fresh capture. The id rather than the index: the strip can lose
   * an entry to the ✕ while the editor is open, and an index would then write
   * the edit onto somebody else's screenshot.
   */
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  /** Which capture the delete confirmation is open on, by id for the same reason. */
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  /**
   * Why the capture path is closed, if it is — and therefore whether the row
   * offers Take screenshot or Attach image.
   *
   * Seeded from a render-time feature check so an iPad or an in-app browser
   * never shows a button that cannot work, and re-set when a click proves the
   * path is shut for a reason that will still hold next time (see
   * `CaptureError.isPersistent`: policy blocks and a denied OS grant stick;
   * cancelling and a lost user-activation do not).
   */
  const [captureClosedBy, setCaptureClosedBy] = useState<PersistentCaptureReason | null>(() =>
    isCaptureSupported() ? null : 'unsupported',
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [auto, setAuto] = useState<AutoShot | null>(null);
  /** A Whole page / Pick a part capture the member asked for is on its way (Send waits for it). */
  const [isRequestedCapture, setIsRequestedCapture] = useState(false);
  const [isPickingPart, setIsPickingPart] = useState(false);
  /** The bridge failed a capture this open: further captures use the screen share (after a click). */
  const [bridgeFailed, setBridgeFailed] = useState(false);
  const useBridge = canCapture && !bridgeFailed;
  const isBusy = isCapturing || Boolean(freezeSrc) || Boolean(cropSrc) || isPickingPart;
  const isPending = isAppFeedbackPending || isContactSupportPending || isHostingImages || isRequestedCapture;
  /* The picture still on its way counts: it's a slot the member can see. */
  const shotCount = screenshots.length + (auto?.status === 'capturing' ? 1 : 0);
  const atShotLimit = shotCount >= MAX_SCREENSHOTS;

  /* Fresh refs for the capture effect, which must not re-run (and re-capture) when they change identity. */
  const captureRef = useRef(capture);
  const analyticsRef = useRef(analytics);
  useEffect(() => {
    captureRef.current = capture;
    analyticsRef.current = analytics;
  });

  /* Each open is a new session: the first time the form shows, it attaches the
     app as it is (if the bridge can), into an empty list. Tracked during render
     so the "Capturing…" chip is there from the first frame. */
  const [wasOpen, setWasOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setOpenCount(openCount + 1);
      setAuto(canCapture ? { token: openCount + 1, status: 'capturing' } : null);
      setBridgeFailed(false);
    } else {
      setAuto(null);
    }
  }

  /* A picture that landed while its open still wanted it joins the list, first. */
  if (auto?.status === 'landed') {
    const { token, dataUrl } = auto;
    setAuto({ token, status: 'attached' });
    setScreenshots((prev) => [
      { id: `shot-auto-${token}`, imageDataUrl: dataUrl, annotations: emptyAnnotations(), source: 'auto' },
      ...prev,
    ]);
  }

  const autoCapturing = auto?.status === 'capturing';
  const autoToken = auto?.token;
  useEffect(() => {
    const take = captureRef.current;
    if (!autoCapturing || !take || autoToken === undefined) return;
    /* The result only counts while this open's auto shot is still capturing:
       removed, closed or sent meanwhile, it belongs to nobody and is dropped.
       Checked inside the state update — an effect cleanup can run AFTER a fast
       capture resolves. */
    const settle = (next: AutoShot) =>
      setAuto((prev) => (prev?.token === autoToken && prev.status === 'capturing' ? next : prev));
    const startedAt = performance.now();
    take()
      .then((shot) => {
        settle({ token: autoToken, status: 'landed', dataUrl: shot.dataUrl });
        analyticsRef.current.onFeedbackAppCapture({
          appUid,
          source: 'auto',
          outcome: 'succeeded',
          ms: Math.round(performance.now() - startedAt),
        });
      })
      .catch((error: unknown) => {
        settle({ token: autoToken, status: 'failed' });
        analyticsRef.current.onFeedbackAppCapture({
          appUid,
          source: 'auto',
          outcome: 'failed',
          ms: Math.round(performance.now() - startedAt),
          error: error instanceof Error ? error.message.slice(0, 60) : 'failed',
        });
      });
  }, [autoCapturing, autoToken, appUid]);

  const removeAutoChip = () => {
    if (!auto) return;
    analytics.onFeedbackAutoShotRemoved({ appUid, whileCapturing: auto.status === 'capturing' });
    setAuto({ token: auto.token, status: 'removed' });
  };
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen) {
      setOverlayStyle(undefined);
      return;
    }

    const update = () => setOverlayStyle(getAnchorOverlayStyle(anchorRef?.current ?? null, placement));
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);
    /* The anchor can move without a resize or scroll. Leaving comment mode for
       this form drops the page's --ai-app-comments-inset (set on the root's
       style) in a passive effect — after this one measured the button still
       shifted beside the comments panel — so measure again on the next frame
       and whenever the root's style changes. */
    const frame = requestAnimationFrame(update);
    const rootStyle = typeof MutationObserver === 'undefined' ? null : new MutationObserver(update);
    rootStyle?.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
      cancelAnimationFrame(frame);
      rootStyle?.disconnect();
    };
  }, [isOpen, anchorRef, placement]);

  const resetCapture = () => {
    setIsCapturing(false);
    setFreezeSrc(null);
    setCropSrc(null);
  };

  const resetForm = () => {
    resetCapture();
    setIsPickingPart(false);
    setScreenshots([]);
    setEditingShotId(null);
    setPendingRemoveId(null);
    setSubmitAttempted(false);
    setShortcutsOpen(false);
  };

  /* What closing would throw away: what was written, or marks on a screenshot.
     A screenshot alone isn't (one is attached on every open). */
  const hasUnsentWork = hasFeedbackContent(message) || screenshots.some((shot) => hasAnyAnnotation(shot.annotations));
  /** Set while "Discard your feedback?" is up: how to close once it is confirmed. */
  const [closeAfterDiscard, setCloseAfterDiscard] = useState<(() => void) | null>(null);

  const requestClose = (close: () => void) => {
    if (hasUnsentWork) {
      setCloseAfterDiscard(() => close);
      return;
    }
    resetForm();
    close();
  };

  const discardAndClose = () => {
    const close = closeAfterDiscard;
    setCloseAfterDiscard(null);
    /* Discarded means gone: the saved draft would otherwise bring the text back on reopen. */
    clearDraft();
    reset(getDefaults());
    resetForm();
    close?.();
  };

  useImperativeHandle(ref, () => ({ requestClose }));

  const onDialogClose = () => requestClose(onClose);

  const onSubmitSuccess = () => {
    clearDraft();
    reset(getDefaults());
    setIsPickingPart(false);
    setScreenshots([]);
    setEditingShotId(null);
    setPendingRemoveId(null);
    resetCapture();
    setSubmitAttempted(false);
    onClose();
  };

  /**
   * One place to land a failed capture: report it, say the right thing, and
   * close the capture path when the reason will still be true next time.
   */
  const handleCaptureFailure = (error: CaptureError, stage: 'request' | 'grab') => {
    analytics.onFeedbackScreenshotCaptureDenied({ reason: error.reason, errorName: error.errorName });
    if (stage === 'grab') {
      analytics.onFeedbackScreenshotCaptureFailed({ stage, errorName: error.errorName });
    }
    /* Cancelling is a decision, not a failure — the old code toasted it in red
       and counted it as denied. An empty message says "nothing to report". */
    if (error.message) toast.error(error.message);
    if (isPersistentReason(error.reason)) setCaptureClosedBy(error.reason);
  };

  const onTakeScreenshot = async () => {
    analytics.onFeedbackScreenshotClicked();
    let stream: MediaStream;
    try {
      stream = await requestTabCapture();
    } catch (error) {
      if (error instanceof CaptureError) {
        handleCaptureFailure(error, 'request');
        return;
      }
      analytics.onFeedbackScreenshotCaptureFailed({ stage: 'request' });
      toast.error('Could not capture a screenshot. Please try again.');
      return;
    }

    flushSync(() => setIsCapturing(true));
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const frame = await grabVideoFrame(stream);
      setFreezeSrc(frame);
    } catch (error) {
      setIsCapturing(false);
      if (error instanceof CaptureError) {
        handleCaptureFailure(error, 'grab');
      } else {
        analytics.onFeedbackScreenshotCaptureFailed({ stage: 'grab' });
        toast.error('Could not capture a screenshot. Please try again.');
      }
    } finally {
      stopCaptureStream(stream);
    }
  };
  const onTakeScreenshotRef = useRef(onTakeScreenshot);
  onTakeScreenshotRef.current = onTakeScreenshot;

  /* ---------- instant screenshots: from the app's bridge, no screen-share prompt ---------- */

  /** A bridge capture the member asked for. Null when it failed (they've been told; the next click screen-shares). */
  const takeRequested = async (source: 'page' | 'part'): Promise<AppCapture | null> => {
    if (!capture) return null;
    const startedAt = performance.now();
    setIsRequestedCapture(true);
    try {
      const shot = await capture();
      analytics.onFeedbackAppCapture({
        appUid,
        source,
        outcome: 'succeeded',
        ms: Math.round(performance.now() - startedAt),
      });
      return shot;
    } catch (error) {
      analytics.onFeedbackAppCapture({
        appUid,
        source,
        outcome: 'failed',
        ms: Math.round(performance.now() - startedAt),
        error: error instanceof Error ? error.message.slice(0, 60) : 'failed',
      });
      /* No automatic screen share: the browser only allows one straight from a click. */
      setBridgeFailed(true);
      toast.error('Couldn’t capture the app. Try again — it will use screen sharing.');
      return null;
    } finally {
      setIsRequestedCapture(false);
    }
  };

  const onWholePage = async () => {
    if (!useBridge) {
      analytics.onFeedbackScreenShareFallback({ reason: 'capture-failed' });
      void onTakeScreenshot();
      return;
    }
    const shot = await takeRequested('page');
    if (!shot) return;
    setScreenshots((prev) => [
      ...prev,
      { id: `shot-${Date.now()}`, imageDataUrl: shot.dataUrl, annotations: emptyAnnotations(), source: 'page' },
    ]);
  };

  const onPickPart = () => {
    if (!useBridge || !frameRef) {
      analytics.onFeedbackScreenShareFallback({ reason: 'capture-failed' });
      void onTakeScreenshot();
      return;
    }
    setIsPickingPart(true);
  };

  /* The picture is taken when the drag ends, so what was framed is what is kept. */
  const onPartSelected = async (rect: FrameRect) => {
    setIsPickingPart(false);
    const shot = await takeRequested('part');
    if (!shot) return;
    try {
      const image = await loadImage(shot.dataUrl);
      const cut = cropImageToDataUrl(image, frameRectToCapturePixels(rect, shot.width, image.naturalWidth));
      setScreenshots((prev) => [
        ...prev,
        { id: `shot-${Date.now()}`, imageDataUrl: cut, annotations: emptyAnnotations(), source: 'part' },
      ]);
    } catch {
      toast.error('Couldn’t cut out that part. Please try again.');
    }
  };

  const onPartCancel = useCallback(() => {
    analyticsRef.current.onFeedbackPickPartCancelled();
    setIsPickingPart(false);
  }, []);

  /* "Misaligned? Tell us" marks the automatic picture; the mark travels with
     the report as a line under it (prototype ai-apps-comments). */
  const onToggleMisaligned = (shotId: string) => {
    const shot = screenshots.find((item) => item.id === shotId);
    if (!shot) return;
    if (!shot.misaligned) analytics.onFeedbackCaptureMisaligned({ appUid });
    setScreenshots((prev) =>
      prev.map((item) => (item.id === shotId ? { ...item, misaligned: !item.misaligned } : item)),
    );
  };

  /**
   * The fallback for anyone the capture path cannot serve.
   *
   * The picked image is handed to `setFreezeSrc`, which is exactly where a
   * captured frame lands — so region select and the annotator run unchanged and
   * a blocked user keeps the pin-and-draw tools rather than getting a plain
   * inline image.
   */
  const onAttachImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    /* Cleared immediately so picking the same file twice still fires a change. */
    event.target.value = '';
    if (!file) return;

    analytics.onFeedbackImageAttached({ trigger: captureClosedBy ?? 'unsupported' });
    try {
      setFreezeSrc(await attachImageFile(file));
    } catch (error) {
      toast.error(error instanceof AttachImageError ? error.message : 'Could not read that image.');
    }
  };

  const onCropSelected = (croppedDataUrl: string) => {
    analytics.onFeedbackScreenshotRegionSelected();
    setFreezeSrc(null);
    setIsCapturing(false);
    setCropSrc(croppedDataUrl);
  };

  const onRegionSelectCancel = () => {
    analytics.onFeedbackScreenshotCaptureCancelled();
    resetCapture();
  };

  const editingShot = editingShotId ? screenshots.find((shot) => shot.id === editingShotId) : undefined;

  /* Reopens a capture on its own annotations. `cropSrc` is what the annotator
     draws on, so an edit points it at the stored image rather than a fresh
     grab. */
  const onEditShot = (shot: ScreenshotAttachment) => {
    analytics.onFeedbackScreenshotEditOpened();
    setEditingShotId(shot.id);
    setCropSrc(shot.imageDataUrl);
  };

  const onAnnotatorDiscard = () => {
    analytics.onFeedbackScreenshotAnnotatorDiscarded({ isEditing: Boolean(editingShotId) });
    setCropSrc(null);
    setEditingShotId(null);
  };

  const onAnnotatorAdd = (annotations: AnnotationState) => {
    if (!cropSrc) return;
    const hasAnnotations = hasAnyAnnotation(annotations);
    /* An edit replaces its own entry IN PLACE — same id, same position. A new
       entry would leave the old drawing in the feedback beside the corrected one,
       and a changed id would remount the chip and lose its place in the strip. */
    if (editingShotId) {
      analytics.onFeedbackScreenshotEditSaved({ hasAnnotations });
      setScreenshots((prev) => prev.map((shot) => (shot.id === editingShotId ? { ...shot, annotations } : shot)));
    } else {
      analytics.onFeedbackScreenshotAdded({ hasAnnotations });
      setScreenshots((prev) => [...prev, { id: `shot-${Date.now()}`, imageDataUrl: cropSrc, annotations }]);
    }
    setCropSrc(null);
    setEditingShotId(null);
  };

  const onRemoveShot = useCallback(
    (shotId: string) => {
      analytics.onFeedbackScreenshotRemoved();
      setScreenshots((prev) => prev.filter((item) => item.id !== shotId));
    },
    [analytics],
  );

  /**
   * Only an annotated capture is worth asking about.
   *
   * A plain screenshot is one drag away from being retaken, so a dialog there is
   * pure friction. One carrying drawings or comments is minutes of work that
   * nothing else on screen can bring back.
   */
  const requestRemoveShot = (shot: ScreenshotAttachment) => {
    if (hasAnyAnnotation(shot.annotations)) {
      setPendingRemoveId(shot.id);
      return;
    }
    onRemoveShot(shot.id);
  };

  const pendingRemoveShot = pendingRemoveId ? screenshots.find((shot) => shot.id === pendingRemoveId) : undefined;

  const onSubmit = handleSubmit(async ({ app, message: rawMessage }) => {
    setSubmitAttempted(true);
    let trimmedMessage = (rawMessage ?? '').trim();

    if (!app?.value || !hasFeedbackContent(trimmedMessage, screenshots.length + pins.length)) {
      return;
    }
    /* Sending doesn't wait for the automatic screenshot: it goes without it. */
    if (auto?.status === 'capturing') setAuto({ token: auto.token, status: 'removed' });

    /* Context and pins-as-data describe the app on screen; feedback switched to
       another app in the picker gets neither (its pins would be located on the
       wrong app). The readable pin block still goes into the text either way. */
    const isAboutThisApp = Boolean(appUid) && app.value === appUid;
    const context = isAboutThisApp ? (getContext?.() ?? null) : null;
    let pinInputs: FeedbackPinInput[] = [];

    try {
      setIsHostingImages(true);
      trimmedMessage = await hostDataUriImages(trimmedMessage);
      trimmedMessage = await appendScreenshots(trimmedMessage, screenshots);
      if (screenshots.some((shot) => shot.misaligned)) {
        trimmedMessage += '<p><em>Automatic screenshot flagged as misaligned.</em></p>';
      }
      if (pins.length > 0) {
        const crops = await hostPinCrops(pins);
        trimmedMessage = appendPinsHtml(trimmedMessage, pins, crops);
        if (isAboutThisApp) pinInputs = toPinInputs(pins, crops, context?.env ?? 'prod');
      }
    } catch {
      toast.error('Image upload failed. Please try again.');
      return;
    } finally {
      setIsHostingImages(false);
    }

    /* Checked here rather than as you type, because until the images are hosted
       the payload is bigger than what actually gets sent — a data URI in the
       editor is megabytes that become a short URL. Measuring earlier would
       refuse submissions that would have fit. */
    if (trimmedMessage.length > MAX_PAYLOAD) {
      analytics.onFeedbackTooLarge({ length: trimmedMessage.length, screenshotCount: screenshots.length });
      toast.error(
        screenshots.length > 0
          ? 'This feedback is too large to send. Try removing a screenshot, or redrawing with fewer strokes.'
          : 'This feedback is too large to send. Try shortening it.',
      );
      return;
    }

    if (app.value === LABOS_AI_APPS_OPTION.value) {
      const email = currentUser?.email;
      const name = currentUser?.name;

      if (!email || !name) {
        toast.error('Something went wrong. Please try again.');
        return;
      }

      submitContactSupport(
        {
          topic: 'AI Apps Feedback',
          email,
          name,
          message: trimmedMessage,
          metadata: {
            logged: Boolean(currentUser),
            uid: currentUser?.uid || '',
            page: window.location.toString(),
          },
        },
        {
          onSuccess: () => {
            onSubmitted?.(app);
            onSubmitSuccess();
          },
        },
      );
      return;
    }

    submitAppFeedback(
      {
        appUid: app.value,
        text: trimmedMessage,
        ...(pinInputs.length > 0 ? { pins: pinInputs } : {}),
        ...(context ? { context } : {}),
      },
      {
        onSuccess: () => {
          analytics.onFeedbackSubmitted({
            appUid: app.value,
            appName: app.label,
            screenshotCount: screenshots.length,
            hasAnnotations: screenshots.some((shot) => hasAnyAnnotation(shot.annotations)),
            ...(pins.length > 0 ? { pinCount: pins.length } : {}),
          });
          toast.success('Thanks for your feedback!');
          onSubmitted?.(app);
          onSubmitSuccess();
        },
        onError: (error: unknown) => {
          analytics.onFeedbackSubmitFailed(app.value);
          toast.error(
            (error as { status?: number })?.status === 403
              ? 'Feedback is turned off for this app.'
              : 'Something went wrong. Please try again.',
          );
        },
      },
    );
  });

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (shortcutsOpen) return;

      if (pendingRemoveId) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
          setPendingRemoveId(null);
          return;
        }
        const confirmsDelete =
          event.key === 'Enter' &&
          !event.shiftKey &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          !event.isComposing;
        if (confirmsDelete) {
          event.preventDefault();
          event.stopImmediatePropagation();
          onRemoveShot(pendingRemoveId);
          setPendingRemoveId(null);
          return;
        }
        if (isSendChord(event) || isScreenshotChord(event)) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        return;
      }

      if (isScreenshotChord(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (isBusy || isPending) return;
        analytics.onFeedbackShortcutUsed({ action: 'screenshot' });
        if (useBridge && frameRef) {
          if (!atShotLimit) setIsPickingPart(true);
        } else if (captureClosedBy) {
          fileInputRef.current?.click();
        } else {
          void onTakeScreenshotRef.current();
        }
        return;
      }

      if (isBusy || !isSendChord(event)) return;
      event.preventDefault();
      if (isPending || isOverLimit) return;
      analytics.onFeedbackShortcutUsed({ action: 'submit' });
      void onSubmit();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [
    isOpen,
    shortcutsOpen,
    pendingRemoveId,
    isBusy,
    isPending,
    isOverLimit,
    captureClosedBy,
    onSubmit,
    onRemoveShot,
    analytics,
    useBridge,
    frameRef,
    atShotLimit,
  ]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onDialogClose}
        closeOnBackdropClick={false}
        /* `pendingRemoveId` is in here but NOT in `isBusy`, which also hides this
           overlay: while the delete confirmation is up, Escape has to stop
           reaching this dialog, but the dialog it is asking about must stay
           visible behind it.

           Without the guard, Escape closes the whole feedback panel and takes
           the typed draft with it — `Modal` registers its handler on `document`
           in the capture phase and calls `stopImmediatePropagation`, so nothing
           the confirmation registers later could ever intercept it. */
        closeOnEscape={!isBusy && !pendingRemoveId && !shortcutsOpen && !closeAfterDiscard}
        overlayClassname={clsx(s.overlay, placement === 'above' && s.overlayAbove, isBusy && s.overlayHidden)}
        overlayStyle={overlayStyle}
        className={s.modalContainer}
      >
        <div className={s.root}>
          <div className={s.header}>
            {headerTabs ?? <h2 className={s.title}>Give feedback</h2>}
            <div className={s.headerActions}>
              <button
                type="button"
                className={s.shortcutsLink}
                onClick={() => {
                  analytics.onFeedbackShortcutsHelpOpened();
                  setShortcutsOpen(true);
                }}
              >
                Shortcuts
              </button>
              <button type="button" className={s.closeButton} onClick={onDialogClose} aria-label="Close">
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          </div>

          <div className={s.content}>
            <FormProvider {...methods}>
              <div className={s.form}>
                <FormSelect
                  name="app"
                  label="Which app is this about?"
                  placeholder="Select an app…"
                  options={appOptions}
                  disabled={isAppsLoading}
                  isRequired
                  // Portalled + fixed so the menu escapes `.root`'s overflow mask and
                  // `auto` can measure viewport space below the control. Forcing
                  // `top` made the list open upward over the nav even though the
                  // field sits at the top of this panel.
                  menuPortalTarget={typeof document === 'undefined' ? null : document.body}
                />
                {submitAttempted && !watch('app') && <p className={s.fieldError}>Please select an app</p>}

                {pins.length > 0 && onEditPins && <PinSummary pins={pins} onEdit={onEditPins} />}

                <div className={s.shots}>
                  <p className={s.fieldLabel}>
                    Screenshots
                    {shotCount > 0 && <span className={s.shotCount}> · {shotCount}</span>}
                  </p>
                  {auto?.status === 'capturing' && (
                    <div className={clsx(s.shot, s.shotPending)} role="status" aria-label="Capturing the app">
                      <span className={s.shotPendingText}>Capturing the app…</span>
                      <div className={s.shotActions}>
                        <button
                          type="button"
                          className={s.shotAction}
                          aria-label="Remove screenshot"
                          onClick={removeAutoChip}
                        >
                          <CloseIcon width={12} height={12} />
                        </button>
                      </div>
                    </div>
                  )}
                  {auto?.status === 'failed' && screenshots.length === 0 && (
                    <p className={s.shotNote}>Couldn’t capture the app automatically — add a screenshot below.</p>
                  )}
                  {screenshots.map((shot, index) => (
                    <figure key={shot.id} className={s.shotFigure}>
                      <div className={s.shot}>
                        <button
                          type="button"
                          className={s.shotImage}
                          aria-label={`Open screenshot ${index + 1}`}
                          onClick={() => onEditShot(shot)}
                        >
                          {/* Marks show on the preview too, so nothing drawn is out of sight (prototype). */}
                          {hasAnyAnnotation(shot.annotations) ? (
                            <AnnotatedPreview
                              src={shot.imageDataUrl}
                              alt={`Screenshot ${index + 1}`}
                              annotations={shot.annotations}
                            />
                          ) : (
                            <img src={shot.imageDataUrl} alt={`Screenshot ${index + 1}`} />
                          )}
                        </button>
                        <div className={s.shotActions}>
                          <button
                            type="button"
                            className={s.shotAction}
                            aria-label={`Annotate screenshot ${index + 1}`}
                            onClick={() => onEditShot(shot)}
                          >
                            <PencilSimpleLineIcon width={12} height={12} />
                            <span aria-hidden="true">Annotate</span>
                          </button>
                          <button
                            type="button"
                            className={s.shotAction}
                            aria-label={`Remove screenshot ${index + 1}`}
                            onClick={() => {
                              if (shot.source === 'auto') {
                                analytics.onFeedbackAutoShotRemoved({ appUid, whileCapturing: false });
                              }
                              requestRemoveShot(shot);
                            }}
                          >
                            <CloseIcon width={12} height={12} />
                          </button>
                        </div>
                      </div>
                      {shot.source === 'auto' && (
                        <figcaption className={s.shotCaption}>
                          Automatic capture may not be exact.{' '}
                          <button
                            type="button"
                            className={s.shotLink}
                            aria-pressed={Boolean(shot.misaligned)}
                            onClick={() => onToggleMisaligned(shot.id)}
                          >
                            {shot.misaligned ? 'Misaligned · noted' : 'Misaligned? Tell us'}
                          </button>
                        </figcaption>
                      )}
                      {shot.source === 'page' && <figcaption className={s.shotCaption}>Whole page</figcaption>}
                      {shot.source === 'part' && <figcaption className={s.shotCaption}>Part of the page</figcaption>}
                    </figure>
                  ))}
                  {canCapture ? (
                    <div className={s.shotButtons}>
                      <button
                        type="button"
                        className={s.screenshotButton}
                        onClick={() => void onWholePage()}
                        disabled={isPending || atShotLimit}
                      >
                        <CameraIcon />
                        Whole page
                      </button>
                      <button
                        type="button"
                        className={s.screenshotButton}
                        onClick={onPickPart}
                        disabled={isPending || atShotLimit}
                        aria-keyshortcuts={shortcuts.screenshotAria}
                      >
                        <CrosshairIcon />
                        Pick a part
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={s.screenshotHint}>{SCREENSHOT_HINTS[captureClosedBy ?? 'open']}</p>
                      <div className={s.shotButtons}>
                        {captureClosedBy ? (
                          <>
                            <button
                              type="button"
                              className={s.screenshotButton}
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isPending}
                              aria-keyshortcuts={shortcuts.screenshotAria}
                            >
                              <ImageIcon />
                              Attach image
                              <kbd className={s.kbd} aria-hidden="true">
                                {shortcuts.screenshot}
                              </kbd>
                            </button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className={s.fileInput}
                              onChange={onAttachImage}
                              aria-label="Attach image"
                            />
                          </>
                        ) : (
                          <button
                            type="button"
                            className={s.screenshotButton}
                            onClick={onTakeScreenshot}
                            disabled={isPending}
                            aria-keyshortcuts={shortcuts.screenshotAria}
                          >
                            <CameraIcon />
                            Take screenshot
                            <kbd className={s.kbd} aria-hidden="true">
                              {shortcuts.screenshot}
                            </kbd>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {atShotLimit && <p className={s.shotNote}>Up to {MAX_SCREENSHOTS} screenshots.</p>}
                </div>

                <FormEditor
                  name="message"
                  label="Your feedback"
                  placeholder={FEEDBACK_PLACEHOLDER}
                  simplified
                  toolbarConfig={FEEDBACK_TOOLBAR}
                  maxLength={MAX_LENGTH}
                  showCharCount
                  minHeight={120}
                  className={s.editor}
                />
              </div>
            </FormProvider>

            {/* Portalled out: this panel is a small anchored popover, and a
                `fixed` child of it is laid out against the popover rather than
                the viewport wherever a transform survives on the container. */}
            <ConfirmLayer isOpen={Boolean(pendingRemoveShot)}>
              <ConfirmDialog
                isOpen
                title="Delete screenshot?"
                message="This screenshot and the annotations on it will be removed from your feedback."
                confirmText="Delete"
                cancelText="Keep"
                onConfirm={() => {
                  if (pendingRemoveShot) onRemoveShot(pendingRemoveShot.id);
                  setPendingRemoveId(null);
                }}
                onCancel={() => setPendingRemoveId(null)}
              />
            </ConfirmLayer>
            <ConfirmLayer isOpen={Boolean(closeAfterDiscard)}>
              <ConfirmDialog
                isOpen
                title="Discard your feedback?"
                message="What you wrote and the marks on your screenshots will be lost."
                confirmText="Discard"
                cancelText="Keep editing"
                onConfirm={discardAndClose}
                onCancel={() => setCloseAfterDiscard(null)}
              />
            </ConfirmLayer>

            <div className={s.postingAs}>
              <CommentIcon />
              <span>
                Posting as <strong>{currentUser?.name ?? 'you'}</strong> · visible to the app&apos;s author and LabOS
                admins
              </span>
            </div>
          </div>

          <div className={s.footer}>
            <div className={s.hints}>
              <span className={s.hint}>
                <kbd className={s.kbd}>{shortcuts.send}</kbd>
                to send
              </span>
              <span className={s.hint}>
                <kbd className={s.kbd}>Esc</kbd>
                to close
              </span>
            </div>
            <div className={s.footerActions}>
              <Button style="border" variant="neutral" onClick={onDialogClose}>
                Cancel
              </Button>
              <Button onClick={onSubmit} disabled={isPending || isOverLimit}>
                {isPending ? 'Sending…' : 'Send feedback'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      {freezeSrc && (
        <RegionSelectOverlay freezeSrc={freezeSrc} onSelect={onCropSelected} onCancel={onRegionSelectCancel} />
      )}
      {isPickingPart && frameRef && (
        <LiveRegionOverlay frameRef={frameRef} onSelect={(rect) => void onPartSelected(rect)} onCancel={onPartCancel} />
      )}
      {cropSrc && (
        <AnnotatorModal
          imageSrc={cropSrc}
          onDiscard={onAnnotatorDiscard}
          onAdd={onAnnotatorAdd}
          onToolSelected={(tool) => analytics.onFeedbackScreenshotToolSelected({ tool })}
          initialAnnotations={editingShot?.annotations}
        />
      )}
      <ShortcutHelp isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} shortcuts={shortcuts} />
    </>
  );
}

function ShortcutHelp({
  isOpen,
  onClose,
  shortcuts,
}: {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutLabels;
}) {
  const groups = [
    {
      title: 'Feedback',
      rows: [
        [shortcuts.open, 'Open feedback'],
        [shortcuts.send, 'Send'],
        ['Esc', 'Close'],
        [shortcuts.screenshot, 'Take screenshot'],
      ],
    },
    {
      title: 'Annotate',
      rows: [
        [shortcuts.send, 'Add to feedback'],
        ['Esc', 'Discard'],
        ['P', 'Draw'],
        ['R', 'Box'],
        ['O', 'Oval'],
        ['A', 'Arrow'],
        ['C', 'Comment'],
        [shortcuts.undo, 'Undo'],
        [shortcuts.redo, 'Redo'],
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassname={s.helpOverlay}
      className={s.helpContainer}
      ariaLabelledBy="feedback-shortcuts-title"
    >
      <div className={s.help}>
        <div className={s.helpHeader}>
          <h2 id="feedback-shortcuts-title" className={s.helpTitle}>
            Keyboard shortcuts
          </h2>
          <button type="button" className={s.closeButton} onClick={onClose} aria-label="Close shortcuts">
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        {groups.map((group) => (
          <section key={group.title} className={s.helpGroup}>
            <h3 className={s.helpGroupTitle}>{group.title}</h3>
            <ul className={s.helpList}>
              {group.rows.map(([keys, label]) => (
                <li key={label} className={s.helpRow}>
                  <span>{label}</span>
                  <kbd className={s.kbd}>{keys}</kbd>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className={s.helpNote}>Enter confirms a prompt. Esc cancels it.</p>
      </div>
    </Modal>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2.6 11.2 6 8l2.2 2.1L10.3 8l3.1 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.1" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5.2 3.5 5.7 2.6A1 1 0 0 1 6.55 2.1h2.9a1 1 0 0 1 .85.5l.5.9H12.5A1.5 1.5 0 0 1 14 5v6.5A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5V5a1.5 1.5 0 0 1 1.5-1.5h1.7ZM8 11a2.75 2.75 0 1 0 0-5.5A2.75 2.75 0 0 0 8 11Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrosshairIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
