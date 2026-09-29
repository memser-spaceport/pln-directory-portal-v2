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
import { isScreenshotChord, isSendChord, useShortcutLabels } from '@/components/page/ai-apps/shortcutKeys';
import {
  AnnotatorModal,
  AttachImageError,
  CaptureError,
  ConfirmLayer,
  RegionSelectOverlay,
  annotatedScreenshotHtml,
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
} from '@/components/page/ai-apps/components/screenshot-feedback';

// Production stylesheet imported verbatim — the popover, header, form stack,
// screenshot row/strip and footer are dev's.
import s from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
// The annotator's footer already puts a chord inside each button (Esc on
// Discard, ⌘↩ on Add to feedback); the dialog's footer now does the same with
// the same classes.
import am from '@/components/page/ai-apps/components/screenshot-feedback/AnnotatorModal.module.scss';
// FormEditor's label, so "Screenshot" is the same kind of label as "Your feedback".
import fe from '@/components/form/FormEditor/FormEditor.module.scss';

import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { currentUser, LABOS_AI_APPS_OPTION, type AiAppWithDoc } from './mocks';
import { useChordLabels } from './shortcutPlatform';

import local from './GiveFeedbackDialog.module.scss';

/** Visible characters the member may type, counted with the markup stripped. */
const MAX_LENGTH = 5000;
const FEEDBACK_TOOLBAR: (string | Record<string, unknown>)[][] = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'link', 'image'],
];
/* Not dev's key: a prototype draft must never surface in the real dialog. */
const DRAFT_KEY = 'prototype:ai-apps:feedback-draft';
const FEEDBACK_PLACEHOLDER = 'What worked, what didn’t, and what would make this more useful?';

/* `open` is LAB-2700's helper line. It replaces dev's "Your browser will ask
   which tab to share — choose this one, then drag…": the browser's own picker
   says the first half, and what the person needs to know before pressing is
   what they can do with the capture. The fallbacks are dev's. */
const SCREENSHOT_HINTS: Record<PersistentCaptureReason | 'open', string> = {
  open: 'Take a screenshot — you can draw and add comments on it after capturing.',
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
  apps: AiAppWithDoc[];
  /** Preselects this app in the picker. */
  appUid?: string;
  appName?: string;
  /** Positions the popover relative to this element. */
  anchorRef?: RefObject<HTMLElement | null>;
  placement?: Placement;
  onSubmit: (appUid: string, appName: string, text: string) => void;
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

/**
 * COPY-SIMPLIFY of production `GiveAiAppFeedbackDialog`. Same composition, same
 * stylesheet, same capture → region select → annotate → strip flow (the capture
 * pieces are imported from dev, not copied), same shortcut chords.
 *
 * Dropped, all of it plumbing:
 * - the react-query app list and mutations, and the contact-support branch for
 *   "LabOS - AI Apps" — submitting calls `onSubmit` with the HTML body;
 * - image hosting and the server payload cap — screenshots stay as data URIs
 *   inside the body, since nothing is uploaded;
 * - analytics.
 *
 * LAB-2700 deviations from dev (the rest is still a transcription):
 * - the Screenshot section (label, capture button, helper line, strip) moved
 *   above the feedback text;
 * - every chord is one pill ("⇧⌘S" / "Ctrl+Shift+S", from `shortcutPlatform`),
 *   placed on the control it presses — the footer hint row is gone;
 * - a "Shortcuts" button in the header opens `KeyboardShortcutsPanel`.
 *
 * The prototype's masthead button anchors it with `placement="below"`, the mode
 * dev's stylesheet is written for ("a plain popover below the Give feedback
 * button"); production itself only mounts it above the floating button.
 */
export function GiveFeedbackDialog({
  isOpen,
  onClose,
  apps,
  appUid,
  appName,
  anchorRef,
  placement = 'below',
  onSubmit,
}: Props) {
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties>();
  /* Production's hook still supplies the aria-keyshortcuts strings; the
     visible pills come from `useChordLabels`, one pill per chord. */
  const shortcuts = useShortcutLabels();
  const chords = useChordLabels();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const shortcutsTriggerRef = useRef<HTMLButtonElement>(null);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);

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
  const isOverLimit = visibleFeedbackLength(message) > MAX_LENGTH;
  const [screenshots, setScreenshots] = useState<ScreenshotAttachment[]>([]);
  const [freezeSrc, setFreezeSrc] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  /** By id, not index — the strip can lose an entry while the editor is open. */
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureClosedBy, setCaptureClosedBy] = useState<PersistentCaptureReason | null>(() =>
    isCaptureSupported() ? null : 'unsupported',
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBusy = isCapturing || Boolean(freezeSrc) || Boolean(cropSrc);
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
    setShortcutsOpen(false);
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

  const handleCaptureFailure = (error: CaptureError) => {
    if (error.message) toast.error(error.message);
    if (isPersistentReason(error.reason)) setCaptureClosedBy(error.reason);
  };

  const onTakeScreenshot = async () => {
    setShortcutsOpen(false);
    let stream: MediaStream;
    try {
      stream = await requestTabCapture();
    } catch (error) {
      if (error instanceof CaptureError) {
        handleCaptureFailure(error);
        return;
      }
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
        handleCaptureFailure(error);
      } else {
        toast.error('Could not capture a screenshot. Please try again.');
      }
    } finally {
      stopCaptureStream(stream);
    }
  };
  const onTakeScreenshotRef = useRef(onTakeScreenshot);
  onTakeScreenshotRef.current = onTakeScreenshot;

  const onAttachImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setFreezeSrc(await attachImageFile(file));
    } catch (error) {
      toast.error(error instanceof AttachImageError ? error.message : 'Could not read that image.');
    }
  };

  const onCropSelected = (croppedDataUrl: string) => {
    setFreezeSrc(null);
    setIsCapturing(false);
    setCropSrc(croppedDataUrl);
  };

  const editingShot = editingShotId ? screenshots.find((shot) => shot.id === editingShotId) : undefined;

  const onEditShot = (shot: ScreenshotAttachment) => {
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
      setScreenshots((prev) => [...prev, { id: `shot-${Date.now()}`, imageDataUrl: cropSrc, annotations }]);
    }
    setCropSrc(null);
    setEditingShotId(null);
  };

  const onRemoveShot = useCallback((shotId: string) => {
    setScreenshots((prev) => prev.filter((item) => item.id !== shotId));
  }, []);

  /** Only an annotated capture is worth confirming; a plain one is one drag from retaken. */
  const requestRemoveShot = (shot: ScreenshotAttachment) => {
    if (hasAnyAnnotation(shot.annotations)) {
      setPendingRemoveId(shot.id);
      return;
    }
    onRemoveShot(shot.id);
  };

  const pendingRemoveShot = pendingRemoveId ? screenshots.find((shot) => shot.id === pendingRemoveId) : undefined;

  const submit = handleSubmit(({ app, message: rawMessage }) => {
    setSubmitAttempted(true);
    const trimmedMessage = (rawMessage ?? '').trim();

    if (!app?.value || !hasFeedbackContent(trimmedMessage, screenshots.length)) {
      return;
    }

    const body = [
      trimmedMessage,
      ...screenshots.map((shot) => annotatedScreenshotHtml(shot.imageDataUrl, shot.annotations)),
    ]
      .filter(Boolean)
      .join('');

    onSubmit(app.value, app.label, body);
    toast.success('Thanks for your feedback!');
    onSubmitSuccess();
  });

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
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
        if (isBusy) return;
        if (captureClosedBy) {
          fileInputRef.current?.click();
        } else {
          void onTakeScreenshotRef.current();
        }
        return;
      }

      if (isBusy || !isSendChord(event)) return;
      event.preventDefault();
      if (isOverLimit) return;
      void submit();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, pendingRemoveId, isBusy, isOverLimit, captureClosedBy, submit, onRemoveShot]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onDialogClose}
        closeOnBackdropClick={false}
        /* `pendingRemoveId` keeps Escape from reaching this dialog while the
           delete confirmation is up — see dev's comment on the same line. */
        closeOnEscape={!isBusy && !pendingRemoveId && !shortcutsOpen}
        overlayClassname={clsx(s.overlay, placement === 'above' && s.overlayAbove, isBusy && s.overlayHidden)}
        overlayStyle={overlayStyle}
        className={s.modalContainer}
      >
        <div className={clsx(s.root, local.root)}>
          <div className={s.header}>
            <h2 className={s.title}>Give feedback</h2>
            <div className={local.headerActions}>
              {/* The reference lives beside the ✕, not in the footer: the
                  footer's width now goes to the chords riding Cancel and Send,
                  and the header has the room. Labelled rather than a bare
                  keyboard glyph, so it can't read as a second icon control
                  beside the ✕. */}
              <button
                ref={shortcutsTriggerRef}
                type="button"
                className={local.shortcutsButton}
                aria-expanded={shortcutsOpen}
                aria-controls="feedback-shortcuts-panel"
                onClick={() => setShortcutsOpen((open) => !open)}
              >
                <KeyboardIcon />
                Shortcuts
              </button>
              <button type="button" className={s.closeButton} onClick={onDialogClose} aria-label="Close">
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          </div>

          <KeyboardShortcutsPanel
            isOpen={shortcutsOpen && !isBusy}
            onClose={closeShortcuts}
            triggerRef={shortcutsTriggerRef}
          />

          <div className={s.content}>
            <FormProvider {...methods}>
              <div className={s.form}>
                <FormSelect
                  name="app"
                  label="Which app is this about?"
                  placeholder="Select an app…"
                  options={appOptions}
                  isRequired
                  menuPortalTarget={typeof document === 'undefined' ? null : document.body}
                />
                {submitAttempted && !watch('app') && <p className={s.fieldError}>Please select an app</p>}

                {/* LAB-2700: the screenshot is its own labelled section, above
                    the text — capture first, then describe. Dev's order (text,
                    then a hint line and button under the editor) left capture
                    as an afterthought below the fold of a 120px editor. */}
                <div className={local.screenshotSection}>
                  <span className={clsx(fe.label, local.screenshotLabel)}>Screenshot</span>
                  <div className={s.screenshotRow}>
                    {captureClosedBy ? (
                      <>
                        <button
                          type="button"
                          className={s.screenshotButton}
                          onClick={() => fileInputRef.current?.click()}
                          aria-keyshortcuts={shortcuts.screenshotAria}
                        >
                          <ImageIcon />
                          Attach image
                          <kbd className={clsx(s.kbd, local.inlineChord)} aria-hidden="true">
                            {chords.screenshot}
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
                        aria-keyshortcuts={shortcuts.screenshotAria}
                      >
                        <CameraIcon />
                        Take screenshot
                        <kbd className={clsx(s.kbd, local.inlineChord)} aria-hidden="true">
                          {chords.screenshot}
                        </kbd>
                      </button>
                    )}
                    <p className={local.screenshotHelper}>{SCREENSHOT_HINTS[captureClosedBy ?? 'open']}</p>
                  </div>

                  {screenshots.length > 0 && (
                    <ul className={clsx(s.screenshotList, local.screenshotStrip)}>
                      {screenshots.map((shot, index) => (
                        <li key={shot.id} className={s.screenshotChip}>
                          {/* The ✕ is the image button's sibling, not its child. */}
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
                {/* Explicit {' '} — dev's JSX glues the separator to the name
                    ("Bublii· visible"); the prototype keeps the space. */}
                Posting as <strong>{currentUser.name}</strong> · visible to the app&apos;s author and LabOS admins
              </span>
            </div>
          </div>

          {/* Dev's "⌘ ↩ to send · Esc to close" hint row is gone: each chord
              now rides the button it presses, the way the annotator's own
              footer already does it (Esc on Discard, ⌘↩ on Add to feedback),
              with the annotator's classes. The full list is behind Shortcuts. */}
          <div className={clsx(s.footer, local.footerEnd)}>
            <div className={s.footerActions}>
              <Button
                style="border"
                variant="neutral"
                className={am.action}
                aria-keyshortcuts="Escape"
                onClick={onDialogClose}
              >
                Cancel
                <kbd className={clsx(am.kbd, local.inlineChord)} aria-hidden="true">
                  {chords.close}
                </kbd>
              </Button>
              <Button
                className={am.action}
                aria-keyshortcuts={shortcuts.sendAria}
                onClick={submit}
                disabled={isOverLimit}
              >
                Send feedback
                <kbd className={clsx(am.kbdOnFill, local.inlineChord)} aria-hidden="true">
                  {chords.send}
                </kbd>
              </Button>
            </div>
          </div>
        </div>
      </Modal>
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

/* No keyboard glyph in `components/icons`; drawn in the same 16px / 1.4 stroke
   family as the camera and image glyphs beside it in this file. */
function KeyboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.7" y="3.7" width="12.6" height="8.6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4.5 6.5h.01M7 6.5h.01M9.5 6.5h.01M12 6.5h-.5M4.5 9.5h7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
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
