'use client';

import { type CSSProperties, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import clsx from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { ConfirmDialog } from '@/components/page/demo-day/FounderPendingView/components/ConfirmDialog';
import { FormEditor } from '@/components/form/FormEditor';
import { FormSelect } from '@/components/form/FormSelect/FormSelect';
import { CloseIcon, CommentIcon, PencilSimpleLineIcon } from '@/components/icons';
import { toast } from '@/components/core/ToastContainer';
import { useFormDraft } from '@/hooks/useFormDraft';
import { isBlankHtml } from '@/utils/html';
import {
  AnnotatorModal,
  CaptureError,
  ConfirmLayer,
  RegionSelectOverlay,
  annotatedScreenshotHtml,
  grabVideoFrame,
  emptyAnnotations,
  hasAnyAnnotation,
  requestTabCapture,
  stopCaptureStream,
  type AnnotationState,
} from '@/components/page/ai-apps/components/screenshot-feedback';

// Production stylesheet, imported verbatim.
import s from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
import local from './ProductionFeedbackDialog.module.scss';

import { currentUser, LABOS_AI_APPS_OPTION, type AiAppWithDoc } from './mocks';
import { captureArea, captureViewport, captureWholePage } from './threads/nativeCapture';
import { PickPartOverlay, type Area } from './threads/PickPartOverlay';
import { PocScreenshots, type PocShot } from './PocScreenshots';

/** An automatic capture that hasn't landed by now is dropped, silently — it was never asked for. */
const AUTO_CAPTURE_TIMEOUT_MS = 12_000;

const MAX_LENGTH = 5000;
const FEEDBACK_TOOLBAR: (string | Record<string, unknown>)[][] = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'link', 'image'],
];
/* Not dev's key, and not the `ai-apps` prototype's either. */
const DRAFT_KEY = 'prototype:ai-apps-comments:feedback-draft';
const FEEDBACK_PLACEHOLDER = 'What worked, what didn’t, and what would make this more useful?';

function hasFeedbackContent(html: string, screenshotCount = 0): boolean {
  return !isBlankHtml(html) || /<img\b/i.test(html) || screenshotCount > 0;
}

function visibleFeedbackLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').length;
}

interface Option {
  label: string;
  value: string;
}

interface FormValues {
  app: Option | null;
  message: string;
}

type FeedbackDraft = { message: string };

const POPOVER_GAP = 8;

type Placement = 'below' | 'above';

export interface SubmittedFeedback {
  appUid: string;
  appName: string;
  /** The editor's HTML, screenshots appended the way dev's `appendScreenshots` does. */
  html: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apps: AiAppWithDoc[];
  appUid?: string;
  appName?: string;
  anchorRef?: RefObject<HTMLElement | null>;
  placement?: Placement;
  onSubmit: (feedback: SubmittedFeedback) => void;
  /** Who "Posting as" names — the View as switch changes it. */
  viewerName?: string;
  /** Proposal: replaces the "Give feedback" title with the Feedback | Comment switch. */
  headerSlot?: React.ReactNode;
  /** Proposal: the first row of the form — the "Comment on the app" door. */
  topSlot?: React.ReactNode;
  /**
   * Proposal (the feedback POC): screenshots are native — our own redraw, no
   * browser share prompt — and the screenshot row becomes feedback-dev-kit's:
   * an automatic capture when the popover opens, Annotate / ✕ on each picture,
   * and two add buttons, Whole page and Pick a part (`PocScreenshots`).
   */
  nativeCapture?: boolean;
}

function getAnchorOverlayStyle(anchor: HTMLElement | null, placement: Placement): CSSProperties | undefined {
  if (!anchor) return undefined;
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

/**
 * COPY-SIMPLIFY of production `GiveAiAppFeedbackDialog` **as it is on `main`**
 * (what is live today): header + ✕, the app picker, the rich-text field, the
 * "Drag to capture any area…" row with Take screenshot, the screenshot strip
 * (press to annotate, ✕ to remove, confirm only when annotated), "Posting as",
 * Cancel / Send feedback. The capture pieces are imported from dev.
 *
 * Not carried from develop (not live yet): the keyboard chords and their
 * reference panel, the attach-image fallback, and the element-pin spike. The
 * `ai-apps` prototype shows the chords (LAB-2700).
 *
 * Dropped as plumbing: react-query, image hosting, contact-support routing,
 * analytics. The rbac gate lives on the button.
 *
 * Proposal additions: the "Comment on the app" door as the form's first row (`topSlot`) and, with
 * `nativeCapture`, the feedback POC's screenshots (`PocScreenshots`): one
 * automatic capture per piece of feedback (first open; kept across close /
 * reopen; a fresh one only after sending), Annotate / ✕ per picture, Whole page and Pick a part.
 */
export function ProductionFeedbackDialog({
  isOpen,
  onClose,
  apps,
  appUid,
  appName,
  anchorRef,
  placement = 'below',
  onSubmit,
  viewerName = currentUser.name,
  headerSlot,
  topSlot,
  nativeCapture = false,
}: Props) {
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties>();
  const appOptions: Option[] = [LABOS_AI_APPS_OPTION, ...apps.map((app) => ({ label: app.name, value: app.uid }))];

  const getDefaults = useCallback(
    (): FormValues => ({ app: appUid && appName ? { label: appName, value: appUid } : null, message: '' }),
    [appUid, appName],
  );

  const methods = useForm<FormValues>({ defaultValues: getDefaults() });
  const { handleSubmit, reset, watch } = methods;
  const { clearDraft } = useFormDraft<FormValues, FeedbackDraft>({
    storageKey: DRAFT_KEY,
    enabled: isOpen,
    methods,
    getDefaults,
    toDraft: (form) => ({ message: form.message }),
    fromDraft: (draft) => ({ ...getDefaults(), message: draft.message }),
    isEmpty: (draft) => !hasFeedbackContent(draft.message ?? ''),
  });
  const message = watch('message') ?? '';
  const selectedApp = watch('app');
  const isOverLimit = visibleFeedbackLength(message) > MAX_LENGTH;
  const [screenshots, setScreenshots] = useState<PocShot[]>([]);
  const [freezeSrc, setFreezeSrc] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  /** POC: the Pick a part surface is up. */
  const [picking, setPicking] = useState(false);
  /** POC: the automatic capture is being taken. */
  const [autoPending, setAutoPending] = useState(false);
  const isBusy = isCapturing || picking || Boolean(freezeSrc) || Boolean(cropSrc);

  // POC: photograph the page behind the popover once per piece of feedback — on
  // the first open, and again only after the feedback has been sent
  // (`onSubmitSuccess` resets the flag). Closing and reopening (✕, Cancel, Esc,
  // the Comment tab) keeps the pictures, like the draft text, and takes no new
  // one; a removed automatic picture stays removed. The component stays mounted
  // between opens, so the ref survives. The popover is left out of the picture
  // rather than hidden, so nothing flickers.
  const autoTakenRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      setAutoPending(false);
      return;
    }
    if (!nativeCapture || autoTakenRef.current) return;
    autoTakenRef.current = true;
    let cancelled = false;
    let settled = false;
    setAutoPending(true);
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), AUTO_CAPTURE_TIMEOUT_MS));
    // A frame first, so the popover exists and can be left out.
    requestAnimationFrame(() => {
      Promise.race([captureViewport([document.querySelector(`.${s.overlay}`)]), timeout])
        .catch(() => null)
        .then((src) => {
          settled = true;
          if (cancelled) return;
          setAutoPending(false);
          if (src)
            setScreenshots((prev) => [
              { id: `auto-${Date.now()}`, imageDataUrl: src, annotations: emptyAnnotations(), source: 'auto' },
              ...prev,
            ]);
        });
    });
    return () => {
      cancelled = true;
      // Closed before the picture landed: nothing was taken, so the next open tries again.
      if (!settled) autoTakenRef.current = false;
    };
  }, [isOpen, nativeCapture]);

  const addShot = (src: string, source: PocShot['source']) =>
    setScreenshots((prev) => [
      ...prev,
      { id: `shot-${Date.now()}`, imageDataUrl: src, annotations: emptyAnnotations(), source },
    ]);

  /** POC: the full page, scrolled-away parts included. The popover hides while it is drawn. */
  const onWholePage = async () => {
    flushSync(() => setIsCapturing(true));
    try {
      addShot(await captureWholePage([document.querySelector(`.${s.overlay}`)]), 'page');
    } catch {
      toast.error('Could not capture the page. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  /** POC: the dragged part of the screen, captured once the surface is gone. */
  const onPartPicked = async (area: Area) => {
    flushSync(() => {
      setPicking(false);
      setIsCapturing(true);
    });
    try {
      addShot(await captureArea(area, [document.querySelector(`.${s.overlay}`)]), 'part');
    } catch {
      toast.error('Could not capture that part. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const onToggleMisaligned = (shot: PocShot) =>
    setScreenshots((prev) => prev.map((x) => (x.id === shot.id ? { ...x, misaligned: !x.misaligned } : x)));
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen) {
      setOverlayStyle(undefined);
      return;
    }
    const update = () => setOverlayStyle(getAnchorOverlayStyle(anchorRef?.current ?? null, placement));
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [isOpen, anchorRef, placement]);

  const resetCapture = () => {
    setIsCapturing(false);
    setFreezeSrc(null);
    setCropSrc(null);
  };

  const onDialogClose = () => {
    resetCapture();
    // POC: the pictures wait for the next open, like the draft text; they are
    // cleared only once the feedback is sent. Production clears them on close.
    if (!nativeCapture) setScreenshots([]);
    setEditingShotId(null);
    setPendingRemoveId(null);
    setSubmitAttempted(false);
    onClose();
  };

  const onSubmitSuccess = () => {
    clearDraft();
    reset(getDefaults());
    setScreenshots([]);
    // The next piece of feedback gets its own automatic picture on the next open.
    autoTakenRef.current = false;
    setEditingShotId(null);
    setPendingRemoveId(null);
    resetCapture();
    setSubmitAttempted(false);
    onClose();
  };

  const onTakeScreenshot = async () => {
    if (nativeCapture) {
      flushSync(() => setIsCapturing(true));
      try {
        // The popover is hidden while capturing (isBusy), and left out besides.
        setFreezeSrc(await captureViewport([document.querySelector(`.${s.overlay}`)]));
      } catch {
        setIsCapturing(false);
        toast.error('Could not capture a screenshot. Please try again.');
      }
      return;
    }
    let stream: MediaStream;
    try {
      stream = await requestTabCapture();
    } catch (error) {
      toast.error(
        error instanceof CaptureError && error.message
          ? error.message
          : 'Could not capture a screenshot. Please try again.',
      );
      return;
    }

    flushSync(() => setIsCapturing(true));
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      setFreezeSrc(await grabVideoFrame(stream));
    } catch {
      setIsCapturing(false);
      toast.error('Could not capture a screenshot. Please try again.');
    } finally {
      stopCaptureStream(stream);
    }
  };

  const onCropSelected = (croppedDataUrl: string) => {
    setFreezeSrc(null);
    setIsCapturing(false);
    setCropSrc(croppedDataUrl);
  };

  const editingShot = editingShotId ? screenshots.find((shot) => shot.id === editingShotId) : undefined;

  const onEditShot = (shot: PocShot) => {
    setEditingShotId(shot.id);
    setCropSrc(shot.imageDataUrl);
  };

  const onAnnotatorDiscard = () => {
    setCropSrc(null);
    setEditingShotId(null);
  };

  const onAnnotatorAdd = (annotations: AnnotationState) => {
    if (!cropSrc) return;
    if (editingShotId) {
      setScreenshots((prev) => prev.map((shot) => (shot.id === editingShotId ? { ...shot, annotations } : shot)));
    } else {
      setScreenshots((prev) => [
        ...prev,
        { id: `shot-${Date.now()}`, imageDataUrl: cropSrc, annotations, source: 'part' },
      ]);
    }
    setCropSrc(null);
    setEditingShotId(null);
  };

  const onRemoveShot = (shotId: string) => setScreenshots((prev) => prev.filter((item) => item.id !== shotId));

  const requestRemoveShot = (shot: PocShot) => {
    if (hasAnyAnnotation(shot.annotations)) {
      setPendingRemoveId(shot.id);
      return;
    }
    onRemoveShot(shot.id);
  };

  const pendingRemoveShot = pendingRemoveId ? screenshots.find((shot) => shot.id === pendingRemoveId) : undefined;

  const submit = handleSubmit(({ app, message: rawMessage }) => {
    setSubmitAttempted(true);
    const trimmed = (rawMessage ?? '').trim();
    if (!app?.value || !hasFeedbackContent(trimmed, screenshots.length)) return;

    const html = [
      trimmed,
      ...screenshots.map((shot) => annotatedScreenshotHtml(shot.imageDataUrl, shot.annotations)),
      // POC: the reporter's flag on the automatic capture travels with the report.
      screenshots.some((shot) => shot.misaligned) ? '<p><em>Automatic screenshot flagged as misaligned.</em></p>' : '',
    ]
      .filter(Boolean)
      .join('');
    onSubmit({ appUid: app.value, appName: app.label, html });
    toast.success('Thanks for your feedback!');
    onSubmitSuccess();
  });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onDialogClose}
        closeOnBackdropClick={false}
        closeOnEscape={!isBusy && !pendingRemoveId}
        overlayClassname={clsx(s.overlay, placement === 'above' && s.overlayAbove, isBusy && s.overlayHidden)}
        overlayStyle={overlayStyle}
        className={s.modalContainer}
      >
        <div className={s.root}>
          <div className={s.header}>
            {headerSlot ?? <h2 className={s.title}>Give feedback</h2>}
            <button type="button" className={s.closeButton} onClick={onDialogClose} aria-label="Close">
              <CloseIcon width={16} height={16} />
            </button>
          </div>

          <div className={s.content}>
            <FormProvider {...methods}>
              <div className={s.form}>
                {topSlot}
                <FormSelect
                  name="app"
                  label="Which app is this about?"
                  placeholder="Select an app…"
                  options={appOptions}
                  isRequired
                  menuPortalTarget={typeof document === 'undefined' ? null : document.body}
                />
                {submitAttempted && !selectedApp && <p className={s.fieldError}>Please select an app</p>}

                {nativeCapture ? (
                  <PocScreenshots
                    shots={screenshots}
                    autoPending={autoPending}
                    busy={isBusy}
                    onAnnotate={onEditShot}
                    onRemove={requestRemoveShot}
                    onToggleMisaligned={onToggleMisaligned}
                    onWholePage={onWholePage}
                    onPickPart={() => setPicking(true)}
                  />
                ) : (
                  <>
                    <div className={s.screenshotRow}>
                      <p className={s.fieldLabel}>Screenshot</p>
                      <p className={clsx(s.screenshotHint, local.hintUnderLabel)}>
                        Drag to capture any area of the page, including the app.
                      </p>
                      <button type="button" className={s.screenshotButton} onClick={onTakeScreenshot}>
                        <CameraIcon />
                        Take screenshot
                      </button>
                    </div>

                    {screenshots.length > 0 && (
                      <ul className={s.screenshotList}>
                        {screenshots.map((shot, index) => (
                          <li key={shot.id} className={s.screenshotChip}>
                            <button
                              type="button"
                              className={s.screenshotOpen}
                              aria-label={`Edit screenshot ${index + 1}`}
                              onClick={() => onEditShot(shot)}
                            >
                              <img src={shot.imageDataUrl} alt={`Screenshot ${index + 1}`} />
                              <span className={s.screenshotEdit} aria-hidden="true">
                                <PencilSimpleLineIcon width={14} height={14} />
                              </span>
                            </button>
                            <button
                              type="button"
                              className={s.screenshotRemove}
                              aria-label={`Remove screenshot ${index + 1}`}
                              onClick={() => requestRemoveShot(shot)}
                            >
                              <CloseIcon width={12} height={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

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

            <div className={s.postingAs}>
              <CommentIcon />
              <span>
                Posting as <strong>{viewerName}</strong> · visible to the app&apos;s author and LabOS admins
              </span>
            </div>
          </div>

          <div className={s.footer}>
            <div className={s.footerActions}>
              <Button style="border" variant="neutral" onClick={onDialogClose}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={isOverLimit}>
                Send feedback
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      {picking && <PickPartOverlay onSelect={onPartPicked} onCancel={() => setPicking(false)} />}
      {freezeSrc && <RegionSelectOverlay freezeSrc={freezeSrc} onSelect={onCropSelected} onCancel={resetCapture} />}
      {cropSrc && (
        <AnnotatorModal
          imageSrc={cropSrc}
          onDiscard={onAnnotatorDiscard}
          onAdd={onAnnotatorAdd}
          initialAnnotations={editingShot?.annotations}
        />
      )}
    </>
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
