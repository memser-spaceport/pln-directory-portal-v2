'use client';

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import clsx from 'clsx';
import { useForm, FormProvider } from 'react-hook-form';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { ConfirmDialog } from '@/components/page/demo-day/FounderPendingView/components/ConfirmDialog';
import { FormEditor } from '@/components/form/FormEditor';
import { FormSelect } from '@/components/form/FormSelect/FormSelect';
import { CloseIcon, CommentIcon, PencilSimpleLineIcon } from '@/components/icons';
import { toast } from '@/components/core/ToastContainer';
import { isBlankHtml } from '@/utils/html';
import {
  AI_APP_FEEDBACK_PRIORITY_LABELS,
  AI_APP_FEEDBACK_REPORT_KINDS,
  type AiAppFeedbackPriority,
  type AiAppFeedbackReportKind,
} from '@/services/ai-app-feedback/constants';
import type { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import {
  isScreenshotChord,
  isSendChord,
  isShortcutsKey,
  useShortcutLabels,
  type ShortcutLabels,
} from '@/components/page/ai-apps/shortcutKeys';
import {
  AttachImageError,
  CaptureError,
  AnnotatedPreview,
  ConfirmLayer,
  LiveRegionOverlay,
  RegionSelectOverlay,
  annotatedScreenshotHtml,
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
} from '@/components/page/ai-apps/components/screenshot-feedback';
import type { AppCapture } from '@/components/page/ai-apps/components/element-pins/useElementPins';
import { normalizeAppPath } from '@/components/page/ai-apps/components/element-pins/useFeedbackOverlay';
import type { FeedbackContext } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { htmlToMarkdown, markdownToHtml } from '@/components/page/ai-apps/utils/feedbackMarkdown';

import {
  discardFeedbackDraft,
  feedbackDraftKey,
  listFeedbackDrafts,
  packTextImages,
  readFeedbackDraft,
  readFeedbackPictures,
  unpackTextImages,
  writeFeedbackDraft,
  writeFeedbackPictures,
  type DraftPlace,
  type NoteView,
  type SavedDraft,
} from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/feedbackDrafts';

// Production stylesheet, verbatim.
import s from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
import local from './FeedbackDoors.module.scss';
import { AnnotatorModal } from './AnnotatorModal';
import { feedbackHref } from '../FeedbackPage';

/**
 * COPY-SIMPLIFY of production `GiveAiAppFeedbackDialog` (develop, 2026-10-05):
 * the popover/drawer form with Kind + Priority, Rich / Markdown note, instant
 * screenshots (Whole page / Pick a part), drafts, shortcuts and the sent state.
 * Transcribed as is; only the data layer is swapped:
 *
 * - apps, the current user and the send come in as props (`apps`, `viewer`,
 *   `onSubmit`) instead of `useAiApps` / `useCurrentUserStore` / the mutations;
 * - nothing is uploaded — screenshots go into the sent text as data URLs;
 * - analytics are a no-op; element pins (the bridge's pin flow) are left out,
 *   comment mode replaces them;
 * - "See your feedback" opens this prototype's Feedback page on "Given".
 */

type Analytics = ReturnType<typeof useAiAppsAnalytics>;
/** Every analytics call is accepted and dropped. */
const NOOP_ANALYTICS = new Proxy({}, { get: () => () => undefined }) as Analytics;

/** Production `ElementPin`, unused here: pins are comment mode's. */
type ElementPin = never;

export interface SubmittedFeedback {
  appUid: string;
  appName: string;
  text: string;
  reportKind?: AiAppFeedbackReportKind;
  priority?: AiAppFeedbackPriority;
  screenshotCount: number;
}

export interface MockAppOption {
  uid: string;
  name: string;
  feedbackEnabled?: boolean;
}

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

const REPORT_KIND_OPTIONS: Option[] = AI_APP_FEEDBACK_REPORT_KINDS.map((kind) => ({ label: kind, value: kind }));
const PRIORITY_OPTIONS: Option[] = Object.entries(AI_APP_FEEDBACK_PRIORITY_LABELS).map(([value, label]) => ({
  label,
  value,
}));

const DEFAULT_REPORT_KIND: Option = { label: 'bug', value: 'bug' };
const DEFAULT_PRIORITY: Option = { label: AI_APP_FEEDBACK_PRIORITY_LABELS.P2, value: 'P2' };

/** The note is markdown. `rich` is what the Rich view's editor holds, `markdown` the Markdown view's source. */
interface FormValues {
  app: Option | null;
  rich: string;
  markdown: string;
  reportKind: Option;
  priority: Option;
}

const POPOVER_GAP = 8;

/** Wide (the right-hand drawer) or the popup, as last chosen in this browser. */
const WIDE_KEY = 'ai-app-feedback:wide';

function readWide(): boolean {
  try {
    return window.localStorage.getItem(WIDE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeWide(wide: boolean) {
  try {
    window.localStorage.setItem(WIDE_KEY, wide ? '1' : '0');
  } catch {
    /* not remembered; the next open is the popup */
  }
}

type Placement = 'below' | 'above';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Mock: the apps the picker offers (production reads `useAiApps`). */
  apps: MockAppOption[];
  /** Mock: who is posting (production reads the auth store). */
  viewer?: { uid: string; name: string; email?: string };
  /** Mock: the send (production posts to the API). */
  onSubmit?: (feedback: SubmittedFeedback) => void;
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
  /** A report was sent; the panel stays open on the sent screen, so its pins are done with. */
  onSent?: () => void;
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
   * Prototype: the form's first row (the "Comment on the app" door). Replaces
   * production's `headerTabs` switch, which review found hard to find and hard
   * to get back from.
   */
  topSlot?: ReactNode;
  /**
   * A picture of the app on screen from its bridge — set when the app's bridge
   * can `capture`. With it the form attaches
   * one when it opens and offers Whole page / Pick a part with no screen-share
   * prompt; without it, today's screen share.
   */
  capture?: () => Promise<AppCapture>;
  /** The app frame, for Pick a part (the drag counts over it). */
  frameRef?: RefObject<HTMLIFrameElement | null>;
  /** The app has no bridge (older starter kit), so it misses instant screenshots. */
  bridgeMissing?: boolean;
}

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
const NO_SHOTS: ScreenshotAttachment[] = [];
const NO_TEXT_IMAGES: string[] = [];

function isSameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function firstLine(html: string): string {
  const text = new DOMParser().parseFromString(html.replace(/<\/(p|h[1-6]|li)>/gi, '$&\n'), 'text/html').body
    .textContent;
  return (
    (text ?? '')
      .split('\n')
      .find((line) => line.trim())
      ?.trim()
      .slice(0, 80) ?? ''
  );
}

function formatDraftTime(at: number): string {
  const date = new Date(at);
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${time}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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
  apps,
  viewer,
  onSubmit: onMockSubmit,
  appUid,
  appName,
  anchorRef,
  placement = 'below',
  pins = NO_PINS,
  onEditPins,
  onSent,
  getContext,
  headerTabs,
  topSlot,
  capture,
  frameRef,
  bridgeMissing = false,
}: Props) {
  const currentUser = viewer;
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties>();
  const isAppsLoading = false;
  // Mock send: a short wait so the pending state is seen, as a real request would show it.
  const [isMockSending, setIsMockSending] = useState(false);
  const isAppFeedbackPending = isMockSending;
  const isContactSupportPending = false;
  const analytics = NOOP_ANALYTICS;
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
    (): FormValues => ({
      app: getDefaultApp(appUid, appName),
      rich: '',
      markdown: '',
      reportKind: DEFAULT_REPORT_KIND,
      priority: DEFAULT_PRIORITY,
    }),
    [appUid, appName],
  );

  const methods = useForm<FormValues>({
    defaultValues: getDefaults(),
  });
  const { handleSubmit, reset, watch, register, setValue } = methods;
  const rich = watch('rich') ?? '';
  const markdown = watch('markdown') ?? '';
  const app = watch('app');
  const reportKind = watch('reportKind')?.value as AiAppFeedbackReportKind | undefined;
  const priority = watch('priority')?.value as AiAppFeedbackPriority | undefined;
  const [noteView, setNoteView] = useState<NoteView>('rich');
  const note = noteView === 'rich' ? htmlToMarkdown(rich) : markdown;
  const noteLength = visibleFeedbackLength(noteView === 'rich' ? rich : markdownToHtml(markdown));
  const isOverLimit = noteLength > MAX_LENGTH;
  const noteLabelId = useId();

  const switchNoteView = (view: NoteView) => {
    if (view === noteView) return;
    if (view === 'markdown') setValue('markdown', note);
    else setValue('rich', markdownToHtml(markdown));
    setNoteView(view);
  };
  const isHostingImages = false;
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

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  /*
   * Drafts. The panel edits one draft at a time, named by the place it was
   * started: the app and, inside it, the screen. Here's, until another is
   * picked from Drafts. It is kept in this browser as it changes, and dropped
   * only once it is sent or discarded.
   */
  const [here, setHere] = useState<DraftPlace>({});
  const [draftPlace, setDraftPlace] = useState<DraftPlace>({});
  const draftKey = feedbackDraftKey(draftPlace);
  const isHere = draftKey === feedbackDraftKey(here);
  /** Set once the draft is in the panel, pictures included: nothing is saved over it before. */
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  /** When the draft in the panel was first kept, if it was restored. */
  const [restoredSince, setRestoredSince] = useState<number | null>(null);
  const [otherDrafts, setOtherDrafts] = useState<SavedDraft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [isDiscardPending, setIsDiscardPending] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [isWide, setIsWide] = useState(false);
  /** The opening line of each report sent while this panel was open. */
  const [sentReports, setSentReports] = useState<string[]>([]);
  /** The last report went to an app, not to support, so it is on "Your feedback". */
  const [sentToApp, setSentToApp] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const keptPicturesRef = useRef<{ key: string; shots: ScreenshotAttachment[]; images: string[] } | null>(null);
  /** Bumped on every load and close, so pictures read back for an earlier one are dropped. */
  const loadTicketRef = useRef(0);

  const placeHere = (): DraftPlace => {
    if (!appUid) return {};
    const appPath = getContext?.()?.appPath;
    return { appUid, appName, ...(appPath ? { screen: normalizeAppPath(appPath) } : {}) };
  };

  /* Each open is a new session: the first time the form shows, it attaches the
     app as it is (if the bridge can), into an empty list — unless a kept draft
     brings its own pictures. Tracked during render so the "Capturing…" chip is
     there from the first frame. */
  const [wasOpen, setWasOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      const place = placeHere();
      setHere(place);
      setDraftPlace(place);
      setOpenCount(openCount + 1);
      setIsWide(readWide());
      const hasDraft = Boolean(readFeedbackDraft(feedbackDraftKey(place)));
      setAuto(canCapture && !hasDraft ? { token: openCount + 1, status: 'capturing' } : null);
      setBridgeFailed(false);
    } else {
      /* What was in the panel stays as a draft; the next open loads it from there. */
      setAuto(null);
      setLoadedKey(null);
      setIsCapturing(false);
      setFreezeSrc(null);
      setCropSrc(null);
      setIsPickingPart(false);
      setScreenshots([]);
      setEditingShotId(null);
      setPendingRemoveId(null);
      setSubmitAttempted(false);
      setShortcutsOpen(false);
      setShowDrafts(false);
      setIsDiscardPending(false);
      setShowSent(false);
      setSentReports([]);
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
  /* Words at once, pictures when IndexedDB answers. */
  const loadDraft = (place: DraftPlace) => {
    const key = feedbackDraftKey(place);
    const saved = readFeedbackDraft(key);
    const ticket = ++loadTicketRef.current;
    const since = saved ? (saved.startedAt ?? saved.savedAt) : null;
    const values: FormValues = {
      ...getDefaults(),
      app: saved?.app ?? getDefaults().app,
      reportKind: REPORT_KIND_OPTIONS.find((option) => option.value === saved?.reportKind) ?? DEFAULT_REPORT_KIND,
      priority: PRIORITY_OPTIONS.find((option) => option.value === saved?.priority) ?? DEFAULT_PRIORITY,
    };
    /* A draft from before the views holds Quill HTML, which the Rich view takes as it is. */
    const withNote = (images: string[]): FormValues => {
      const text = unpackTextImages(saved?.message ?? '', images);
      if (saved?.view === 'markdown') return { ...values, markdown: text };
      return { ...values, rich: saved?.view ? markdownToHtml(text) : text };
    };
    setDraftPlace(place);
    setLoadedKey(null);
    setRestoredSince(since);
    setNoteView(saved?.view ?? 'rich');
    startedAtRef.current = since;
    if (!saved?.pictures) {
      reset(withNote([]));
      if (saved) setScreenshots([]);
      setLoadedKey(key);
      return;
    }
    reset(values);
    setScreenshots([]);
    void readFeedbackPictures(key).then((pictures) => {
      if (ticket !== loadTicketRef.current) return;
      reset(withNote(pictures?.images ?? []));
      setScreenshots(pictures?.shots ?? []);
      setLoadedKey(key);
    });
  };

  useEffect(() => {
    if (isOpen) loadDraft(here);
    else loadTicketRef.current += 1;
    // Once per open: `here` is set in the render that opens it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openCount]);

  /* Words, a screenshot they added, or marks on one. The automatic screenshot alone is not a
     draft, but once there is one it is kept with the rest. */
  const worthKeeping =
    hasFeedbackContent(note) ||
    screenshots.some((shot) => shot.source !== 'auto' || hasAnyAnnotation(shot.annotations));

  useEffect(() => {
    if (!isOpen || loadedKey !== draftKey) return;
    const { message: packed, images } = packTextImages(note);
    if (worthKeeping) startedAtRef.current ??= Date.now();
    else startedAtRef.current = null;
    writeFeedbackDraft(
      draftKey,
      worthKeeping
        ? {
            message: packed,
            view: noteView,
            app,
            reportKind,
            priority,
            place: draftPlace,
            pictures: screenshots.length + images.length,
            startedAt: startedAtRef.current ?? undefined,
          }
        : null,
    );

    /* Pictures change rarely — taken, drawn on, removed — so they are written only when they do. */
    const shots = worthKeeping ? screenshots : NO_SHOTS;
    const kept = worthKeeping ? images : NO_TEXT_IMAGES;
    const last = keptPicturesRef.current;
    if (last?.key === draftKey && last.shots === shots && isSameList(last.images, kept)) return;
    keptPicturesRef.current = { key: draftKey, shots, images: kept };
    void writeFeedbackPictures(draftKey, { shots, images: kept });
  }, [isOpen, loadedKey, draftKey, draftPlace, note, noteView, app, reportKind, priority, screenshots, worthKeeping]);

  useEffect(() => {
    if (isOpen) setOtherDrafts(listFeedbackDrafts().filter((draft) => draft.key !== draftKey));
  }, [isOpen, draftKey, showDrafts]);

  /* The draft in the panel is already kept as it stands. */
  const openDraft = (draft: SavedDraft) => {
    if (auto?.status === 'capturing') setAuto({ token: auto.token, status: 'removed' });
    setShowDrafts(false);
    loadDraft(draft.place ?? {});
  };

  const placeLabel = (place: DraftPlace) => {
    if (!place.appUid) return 'AI Apps list';
    const name = apps.find((item) => item.uid === place.appUid)?.name ?? place.appName ?? 'An app';
    return place.screen ? `${name} · ${place.screen}` : name;
  };

  const discardDraft = () => {
    setIsDiscardPending(false);
    discardFeedbackDraft(draftKey);
    reset(getDefaults());
    setScreenshots([]);
    onClose();
  };

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

  const onSubmitSuccess = (opening: string, toApp: boolean) => {
    discardFeedbackDraft(draftKey);
    reset(getDefaults());
    setIsPickingPart(false);
    setScreenshots([]);
    setEditingShotId(null);
    setPendingRemoveId(null);
    resetCapture();
    setSubmitAttempted(false);
    setShowDrafts(false);
    setSentReports((prev) => [...prev, opening]);
    setSentToApp(toApp);
    setShowSent(true);
    onSent?.();
  };

  /* A fresh form for the place this panel was opened on, as if it had just been opened. */
  const giveMoreFeedback = useCallback(() => {
    const hasDraft = Boolean(readFeedbackDraft(feedbackDraftKey(here)));
    setAuto(canCapture && !hasDraft ? { token: openCount + 1, status: 'capturing' } : null);
    setBridgeFailed(false);
    setOpenCount(openCount + 1);
    setShowSent(false);
  }, [here, canCapture, openCount]);

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

  const onSubmit = handleSubmit(async ({ app }) => {
    setSubmitAttempted(true);
    /* Not trimmed at the start: leading spaces can mean something in markdown. */
    let trimmedMessage = note.trimEnd();
    const opening = firstLine(markdownToHtml(trimmedMessage));

    if (!app?.value || !hasFeedbackContent(trimmedMessage, screenshots.length + pins.length)) {
      return;
    }
    /* Sending doesn't wait for the automatic screenshot: it goes without it. */
    if (auto?.status === 'capturing') setAuto({ token: auto.token, status: 'removed' });

    /* Mock: production hosts the images and posts (context, pins as data);
       here the pictures stay data URLs and the send is a short wait. */
    void getContext;
    let attached = isHere ? '' : `<p>Started on ${escapeHtml(placeLabel(draftPlace))}</p>`;
    attached += screenshots.map((shot) => annotatedScreenshotHtml(shot.imageDataUrl, shot.annotations)).join('');
    trimmedMessage = [trimmedMessage, attached].filter(Boolean).join('\n\n');

    const toApp = app.value !== LABOS_AI_APPS_OPTION.value;
    setIsMockSending(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsMockSending(false);
    onMockSubmit?.({
      appUid: app.value,
      appName: app.label,
      text: trimmedMessage,
      reportKind: toApp ? reportKind : undefined,
      priority: toApp ? priority : undefined,
      screenshotCount: screenshots.length,
    });
    onSubmitSuccess(opening, toApp);
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

      if (isShortcutsKey(event)) {
        if (isBusy || isDiscardPending) return;
        event.preventDefault();
        analytics.onFeedbackShortcutsHelpOpened();
        setShortcutsOpen(true);
        return;
      }

      if (showSent) {
        if (!isSendChord(event)) return;
        event.preventDefault();
        giveMoreFeedback();
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
    isDiscardPending,
    isBusy,
    isPending,
    isOverLimit,
    captureClosedBy,
    showSent,
    giveMoreFeedback,
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
        onClose={onClose}
        closeOnBackdropClick={false}
        /* `pendingRemoveId` is in here but NOT in `isBusy`, which also hides this
           overlay: while the delete confirmation is up, Escape has to stop
           reaching this dialog, but the dialog it is asking about must stay
           visible behind it.

           Without the guard, Escape closes the whole feedback panel and takes
           the typed draft with it — `Modal` registers its handler on `document`
           in the capture phase and calls `stopImmediatePropagation`, so nothing
           the confirmation registers later could ever intercept it. */
        closeOnEscape={!isBusy && !pendingRemoveId && !shortcutsOpen && !isDiscardPending}
        overlayClassname={clsx(
          s.overlay,
          placement === 'above' && s.overlayAbove,
          isWide && s.overlayWide,
          isBusy && s.overlayHidden,
        )}
        overlayStyle={overlayStyle}
        className={clsx(s.modalContainer, isWide && s.modalContainerWide)}
      >
        <div className={s.root}>
          <div className={s.header}>
            {headerTabs ?? <h2 className={s.title}>Give feedback</h2>}
            <div className={s.headerActions}>
              {!showSent && otherDrafts.length > 0 && (
                <button
                  type="button"
                  className={clsx(s.shortcutsLink, local.textLink)}
                  aria-expanded={showDrafts}
                  onClick={() => setShowDrafts((open) => !open)}
                >
                  Drafts · {otherDrafts.length}
                </button>
              )}
              <button
                type="button"
                className={clsx(s.shortcutsLink, s.shortcutsHelpLink, local.textLink)}
                onClick={() => {
                  analytics.onFeedbackShortcutsHelpOpened();
                  setShortcutsOpen(true);
                }}
              >
                Shortcuts
              </button>
              <button
                type="button"
                className={s.closeButton}
                aria-label={isWide ? 'Narrower' : 'Wider'}
                title={isWide ? 'Narrower' : 'Wider'}
                onClick={() => {
                  writeWide(!isWide);
                  setIsWide(!isWide);
                }}
              >
                {isWide ? <NarrowerIcon /> : <WiderIcon />}
              </button>
              <button type="button" className={s.closeButton} onClick={onClose} aria-label="Close">
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          </div>

          {showSent ? (
            <div className={s.content}>
              <div className={s.sent} role="status">
                <h3 className={s.sentTitle}>Feedback sent</h3>
                <p className={s.sentText}>Thanks for your feedback!</p>
                {sentToApp && (
                  <Link href={feedbackHref('mine')} className={s.sentLink} onClick={onClose}>
                    See your feedback and its status
                  </Link>
                )}
              </div>
              <div className={s.footerActions}>
                <Button
                  style="border"
                  variant="neutral"
                  className={s.footerButton}
                  onClick={onClose}
                  aria-keyshortcuts="Escape"
                >
                  Close
                  <kbd className={clsx(s.kbd, s.kbdHint)} aria-hidden="true">
                    Esc
                  </kbd>
                </Button>
                <Button
                  autoFocus
                  className={s.footerButton}
                  onClick={giveMoreFeedback}
                  aria-keyshortcuts={shortcuts.sendAria}
                >
                  Give more feedback
                  <kbd className={clsx(s.kbd, s.kbdOnPrimary, s.kbdHint)} aria-hidden="true">
                    {shortcuts.send}
                  </kbd>
                </Button>
              </div>
              {sentReports.length > 1 && (
                <div className={s.drafts}>
                  <p className={s.fieldLabel}>Sent while this was open · {sentReports.length}</p>
                  <ul className={s.draftList}>
                    {sentReports.map((opening, index) => (
                      <li key={index} className={s.sentRow}>
                        {opening || 'No text'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={s.content}>
                {topSlot}
                {showDrafts && otherDrafts.length > 0 && (
                  <div className={s.drafts}>
                    <p className={s.fieldLabel}>Unsent, kept in this browser · {otherDrafts.length}</p>
                    <ul className={s.draftList}>
                      {otherDrafts.map((draft) => (
                        <li key={draft.key}>
                          <button type="button" className={s.draftRow} onClick={() => openDraft(draft)}>
                            <span className={s.draftTitle}>
                              {firstLine(draft.view ? markdownToHtml(draft.message) : draft.message) || 'No words yet'}
                            </span>
                            <span className={s.draftMeta}>
                              {placeLabel(draft.place ?? {})} · {formatDraftTime(draft.savedAt)}
                              {draft.pictures
                                ? ` · ${draft.pictures} ${draft.pictures === 1 ? 'picture' : 'pictures'}`
                                : ''}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className={s.shotNote}>
                      Choosing one puts it in this panel, pictures and all
                      {worthKeeping ? '; the one here now is kept' : ''}.
                    </p>
                  </div>
                )}
                <FormProvider {...methods}>
                  <div
                    className={s.form}
                    onKeyDownCapture={(event) => {
                      /* Kept from Quill, which would type a tab: Tab moves to the next field. */
                      if (event.key === 'Tab' && (event.target as HTMLElement).isContentEditable)
                        event.stopPropagation();
                    }}
                  >
                    <div className={s.formGroup}>
                      {restoredSince !== null && worthKeeping && (
                        <p className={s.draftNote}>
                          Your unsent draft{' '}
                          {isHere
                            ? `for this ${here.screen ? 'screen' : appUid ? 'app' : 'page'}`
                            : `started on ${placeLabel(draftPlace)}`}
                          , kept in this browser since {formatDraftTime(restoredSince)}.
                        </p>
                      )}
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
                    </div>

                    <div className={clsx(s.formGroup, s.shotsColumn)}>
                      {/* Production: PinSummary for the bridge pin flow — not in this copy. */}

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
                        {bridgeMissing && (
                          <p className={s.shotNote}>
                            This app is built on an older starter kit, so instant screenshots aren&apos;t available. Its
                            author can update it to turn them on.
                          </p>
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
                            {shot.source === 'page' && <figcaption className={s.shotCaption}>Whole page</figcaption>}
                            {shot.source === 'part' && (
                              <figcaption className={s.shotCaption}>Part of the page</figcaption>
                            )}
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
                              <kbd className={clsx(s.kbd, s.kbdHint)} aria-hidden="true">
                                {shortcuts.screenshot}
                              </kbd>
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
                                    <kbd className={clsx(s.kbd, s.kbdHint)} aria-hidden="true">
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
                                  <kbd className={clsx(s.kbd, s.kbdHint)} aria-hidden="true">
                                    {shortcuts.screenshot}
                                  </kbd>
                                </button>
                              )}
                            </div>
                          </>
                        )}
                        {atShotLimit && <p className={s.shotNote}>Up to {MAX_SCREENSHOTS} screenshots.</p>}
                      </div>
                    </div>

                    <div className={s.writing}>
                      <div className={s.noteHeader}>
                        <p className={s.fieldLabel} id={noteLabelId}>
                          Your feedback
                        </p>
                        <div className={s.noteViews} role="tablist" aria-label="Show the note as">
                          {(['rich', 'markdown'] as const).map((view) => (
                            <button
                              key={view}
                              type="button"
                              role="tab"
                              aria-selected={noteView === view}
                              className={clsx(s.noteView, noteView === view && s.noteViewActive)}
                              onClick={() => switchNoteView(view)}
                            >
                              {view === 'rich' ? 'Rich' : 'Markdown'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {noteView === 'rich' ? (
                        <FormEditor
                          name="rich"
                          placeholder={FEEDBACK_PLACEHOLDER}
                          simplified
                          toolbarConfig={FEEDBACK_TOOLBAR}
                          markdownShortcuts
                          minHeight={isWide ? 360 : 120}
                          className={s.editor}
                        />
                      ) : (
                        <textarea
                          {...register('markdown')}
                          aria-labelledby={noteLabelId}
                          placeholder={FEEDBACK_PLACEHOLDER}
                          className={s.noteSource}
                          style={{ minHeight: isWide ? 402 : 162 }}
                        />
                      )}
                      <span className={clsx(s.noteCount, isOverLimit && s.noteCountOver)}>
                        {noteLength} / {MAX_LENGTH}
                      </span>
                    </div>

                    <div className={s.triage}>
                      <FormSelect
                        name="reportKind"
                        label="Kind"
                        placeholder="Kind"
                        options={REPORT_KIND_OPTIONS}
                        menuPortalTarget={typeof document === 'undefined' ? null : document.body}
                      />
                      <FormSelect
                        name="priority"
                        label="Priority"
                        placeholder="Priority"
                        options={PRIORITY_OPTIONS}
                        menuPortalTarget={typeof document === 'undefined' ? null : document.body}
                      />
                    </div>
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
                <ConfirmLayer isOpen={isDiscardPending}>
                  <ConfirmDialog
                    isOpen
                    title="Discard this draft?"
                    message="What you wrote and your screenshots, with the marks on them, will be deleted from this browser."
                    confirmText="Discard"
                    cancelText="Keep"
                    onConfirm={discardDraft}
                    onCancel={() => setIsDiscardPending(false)}
                  />
                </ConfirmLayer>

                <div className={s.postingAs}>
                  <CommentIcon />
                  <span>
                    Posting as <strong>{currentUser?.name ?? 'you'}</strong> · visible to the app&apos;s author and
                    LabOS admins
                  </span>
                </div>
              </div>

              <div className={s.footer}>
                <div className={s.footerActions}>
                  {worthKeeping && (
                    <Button
                      style="link"
                      variant="error"
                      className={s.discardButton}
                      onClick={() => setIsDiscardPending(true)}
                    >
                      Discard
                    </Button>
                  )}
                  <Button
                    style="border"
                    variant="neutral"
                    className={s.footerButton}
                    onClick={onClose}
                    aria-keyshortcuts="Escape"
                  >
                    Cancel
                    <kbd className={clsx(s.kbd, s.kbdHint)} aria-hidden="true">
                      Esc
                    </kbd>
                  </Button>
                  <Button
                    className={s.footerButton}
                    onClick={onSubmit}
                    disabled={isPending || isOverLimit}
                    aria-keyshortcuts={shortcuts.sendAria}
                  >
                    {isPending ? 'Sending…' : 'Send feedback'}
                    <kbd className={clsx(s.kbd, s.kbdOnPrimary, s.kbdHint)} aria-hidden="true">
                      {shortcuts.send}
                    </kbd>
                  </Button>
                </div>
              </div>
            </>
          )}
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

export function ShortcutHelp({
  isOpen,
  onClose,
  shortcuts,
}: {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutLabels;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (!isShortcutsKey(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [isOpen, onClose]);

  const groups: { title: string; rows: [string | string[], string][] }[] = [
    {
      title: 'Feedback',
      rows: [
        [[shortcuts.open, shortcuts.openAlt], 'Open feedback'],
        [shortcuts.send, 'Send'],
        [shortcuts.send, 'Give more feedback, once sent'],
        ['Esc', 'Close'],
        [['Tab', shortcuts.prevField], 'Next or previous field'],
        [shortcuts.screenshot, 'Take screenshot'],
        [shortcuts.enter, 'Use this part, after a touch or pen drag'],
        ['Esc', 'Cancel picking a part'],
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
        ['T', 'Text'],
        [shortcuts.enter, 'New line in a label'],
        [shortcuts.send, 'Leave a label, keeping the text'],
        ['Esc', 'Leave a label, then deselect it, before discarding'],
        [shortcuts.undo, 'Undo'],
        [[shortcuts.redo, shortcuts.redoAlt], 'Redo'],
      ],
    },
    {
      title: 'This list',
      rows: [
        ['?', 'Show or hide'],
        ['Esc', 'Close'],
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
                  {Array.isArray(keys) ? (
                    <span>
                      <kbd className={s.kbd}>{keys[0]}</kbd> or <kbd className={s.kbd}>{keys[1]}</kbd>
                    </span>
                  ) : (
                    <kbd className={s.kbd}>{keys}</kbd>
                  )}
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

function WiderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 8h12M5 5 2 8l3 3M11 5l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NarrowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1.5 8H6.5M9.5 8h5M3.5 5l3 3-3 3M12.5 5l-3 3 3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
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
