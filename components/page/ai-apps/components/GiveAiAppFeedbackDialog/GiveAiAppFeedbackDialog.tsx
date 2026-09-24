'use client';

import { type CSSProperties, type RefObject, useCallback, useLayoutEffect, useRef, useState } from 'react';
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
  AnnotatorModal,
  AttachImageError,
  CaptureError,
  ConfirmLayer,
  RegionSelectOverlay,
  appendScreenshots,
  attachImageFile,
  grabVideoFrame,
  hasAnyAnnotation,
  isCaptureSupported,
  isPersistentReason,
  requestTabCapture,
  stopCaptureStream,
  type AnnotationState,
  type PersistentCaptureReason,
  type ScreenshotAttachment,
} from '../screenshot-feedback';

import s from './GiveAiAppFeedbackDialog.module.scss';

const MAX_LENGTH = 5000;
const FEEDBACK_TOOLBAR: (string | Record<string, unknown>)[][] = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'link', 'image'],
];
export const AI_APP_FEEDBACK_DRAFT_KEY = 'form-draft:ai-app-feedback';
export const FEEDBACK_PLACEHOLDER = 'What worked, what didn’t, and what would make this more useful?';

/**
 * What the line above the button says, keyed by why the capture path is shut.
 *
 * `open` names the browser picker, which the old copy never did — the picker is
 * the moment people got lost, because nothing had told them to expect it.
 */
const SCREENSHOT_HINTS: Record<PersistentCaptureReason | 'open', string> = {
  open: 'Your browser will ask which tab to share — choose this one, then drag to capture any area of the page.',
  unsupported: 'Screenshots need a desktop browser — take one on your device and attach it here.',
  blocked: 'Screen sharing is turned off in this browser — attach a screenshot instead.',
  unreadable: 'Your browser couldn’t read the screen — attach a screenshot instead.',
};

function hasFeedbackContent(html: string, screenshotCount = 0): boolean {
  return !isBlankHtml(html) || /<img\b/i.test(html) || screenshotCount > 0;
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

export function GiveAiAppFeedbackDialog({ isOpen, onClose, appUid, appName, anchorRef, placement = 'below' }: Props) {
  const { currentUser } = useCurrentUserStore();
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties>();
  const { apps, isLoading: isAppsLoading } = useAiApps();
  const { mutate: submitAppFeedback, isPending: isAppFeedbackPending } = useSubmitAiAppFeedback();
  const { mutate: submitContactSupport, isPending: isContactSupportPending } = useContactSupport();
  const analytics = useAiAppsAnalytics();

  const appOptions: Option[] = [LABOS_AI_APPS_OPTION, ...apps.map((app) => ({ label: app.name, value: app.uid }))];

  const getDefaults = useCallback(
    (): FormValues => ({ app: getDefaultApp(appUid, appName), message: '' }),
    [appUid, appName],
  );

  const methods = useForm<FormValues>({
    defaultValues: getDefaults(),
  });
  const { handleSubmit, reset, watch } = methods;
  const { clearDraft } = useFormDraft<FormValues, FeedbackDraft>({
    storageKey: AI_APP_FEEDBACK_DRAFT_KEY,
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
  const isBusy = isCapturing || Boolean(freezeSrc) || Boolean(cropSrc);
  const isPending = isAppFeedbackPending || isContactSupportPending || isHostingImages;
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
    setScreenshots([]);
    setEditingShotId(null);
    setPendingRemoveId(null);
    setSubmitAttempted(false);
    onClose();
  };

  const onSubmitSuccess = () => {
    clearDraft();
    reset(getDefaults());
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

  const onRemoveShot = (shotId: string) => {
    analytics.onFeedbackScreenshotRemoved();
    setScreenshots((prev) => prev.filter((item) => item.id !== shotId));
  };

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

    if (!app?.value || !hasFeedbackContent(trimmedMessage, screenshots.length)) {
      return;
    }

    try {
      setIsHostingImages(true);
      trimmedMessage = await hostDataUriImages(trimmedMessage);
      trimmedMessage = await appendScreenshots(trimmedMessage, screenshots);
    } catch {
      toast.error('Image upload failed. Please try again.');
      return;
    } finally {
      setIsHostingImages(false);
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
          onSuccess: onSubmitSuccess,
        },
      );
      return;
    }

    submitAppFeedback(
      { appUid: app.value, text: trimmedMessage },
      {
        onSuccess: () => {
          analytics.onFeedbackSubmitted({
            appUid: app.value,
            appName: app.label,
            screenshotCount: screenshots.length,
            hasAnnotations: screenshots.some((shot) => hasAnyAnnotation(shot.annotations)),
          });
          toast.success('Thanks for your feedback!');
          onSubmitSuccess();
        },
        onError: () => {
          analytics.onFeedbackSubmitFailed(app.value);
          toast.error('Something went wrong. Please try again.');
        },
      },
    );
  });

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
        closeOnEscape={!isBusy && !pendingRemoveId}
        overlayClassname={clsx(s.overlay, placement === 'above' && s.overlayAbove, isBusy && s.overlayHidden)}
        overlayStyle={overlayStyle}
        className={s.modalContainer}
      >
        <div className={s.root}>
          <div className={s.header}>
            <h2 className={s.title}>Give feedback</h2>
            <button type="button" className={s.closeButton} onClick={onDialogClose} aria-label="Close">
              <CloseIcon width={16} height={16} />
            </button>
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

                <div className={s.screenshotRow}>
                  <p className={s.screenshotHint}>{SCREENSHOT_HINTS[captureClosedBy ?? 'open']}</p>
                  {captureClosedBy ? (
                    <>
                      <button
                        type="button"
                        className={s.screenshotButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending}
                      >
                        <ImageIcon />
                        Attach image
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
                    >
                      <CameraIcon />
                      Take screenshot
                    </button>
                  )}
                </div>

                {screenshots.length > 0 && (
                  <ul className={s.screenshotList}>
                    {screenshots.map((shot, index) => (
                      <li key={shot.id} className={s.screenshotChip}>
                        {/* The image is the press, the ✕ is its SIBLING rather
                            than its child: a button inside a button is invalid
                            markup that browsers reparent, and the reparenting is
                            how a Remove press ends up opening the editor. */}
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

            <div className={s.postingAs}>
              <CommentIcon />
              <span>
                Posting as <strong>{currentUser?.name ?? 'you'}</strong> · visible to the app&apos;s author and LabOS
                admins
              </span>
            </div>
          </div>

          <div className={s.footer}>
            <Button style="border" variant="neutral" onClick={onDialogClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isPending || isOverLimit}>
              {isPending ? 'Sending…' : 'Send feedback'}
            </Button>
          </div>
        </div>
      </Modal>
      {freezeSrc && (
        <RegionSelectOverlay freezeSrc={freezeSrc} onSelect={onCropSelected} onCancel={onRegionSelectCancel} />
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
    </>
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
