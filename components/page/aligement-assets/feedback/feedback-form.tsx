'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FeedbackApiError, FeedbackType, TYPE_LABELS } from '@/services/plaa/feedback/feedback.types';
import { stripImageMetadata, validateScreenshotFile } from './screenshot.utils';

const TYPES: FeedbackType[] = ['feature', 'bug', 'improvement'];

const DESCRIPTION_LABEL: Record<FeedbackType, string> = {
  feature: 'Describe the new feature',
  improvement: 'What should change, and where?',
  bug: 'What happened, and what did you expect?',
};

const TITLE_MIN = 5;
const TITLE_MAX = 120;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 5000;
const IMPORTANCE_MAX = 2000;
const MAX_SCREENSHOTS = 3;

export interface FeedbackFormValues {
  type: FeedbackType;
  title: string;
  description: string;
  importance?: string;
  link_url?: string;
  source_path?: string;
  screenshots: File[];
}

/**
 * Give feedback (F-1).
 *
 * Validation mirrors the service so a rejectable submission never leaves the
 * browser, but the service is still the authority — this is a courtesy, not a
 * gate.
 */
export default function FeedbackForm({
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
  sourcePath,
}: {
  onClose: () => void;
  onSubmit: (values: FeedbackFormValues) => void;
  isSubmitting: boolean;
  submitError?: unknown;
  /** Captured silently for bugs (§6). */
  sourcePath?: string;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const typeGroupRef = useRef<HTMLDivElement>(null);

  const [type, setType] = useState<FeedbackType>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const isDirty = Boolean(title || description || importance || linkUrl || screenshots.length);

  const errors = {
    title:
      title.trim().length === 0
        ? 'Give your idea a title.'
        : title.trim().length < TITLE_MIN
          ? `Titles are at least ${TITLE_MIN} characters.`
          : null,
    description:
      description.trim().length < DESCRIPTION_MIN
        ? `Add a bit more detail — at least ${DESCRIPTION_MIN} characters.`
        : null,
    link: linkUrl && !linkUrl.startsWith('https://') ? 'Links must start with https://' : null,
  };
  const isValid = !errors.title && !errors.description && !errors.link;

  // AC-T5.1: focus lands on the type selector, Esc closes, unsaved text asks first.
  useEffect(() => {
    typeGroupRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        requestClose();
      }
      if (event.key === 'Tab') trapFocus(event);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  });

  function trapFocus(event: KeyboardEvent) {
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input, textarea, a[href]',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function requestClose() {
    if (isDirty) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setFileError(null);

    const incoming = Array.from(fileList);
    if (screenshots.length + incoming.length > MAX_SCREENSHOTS) {
      setFileError(`You can attach up to ${MAX_SCREENSHOTS} screenshots.`);
      return;
    }

    const accepted: File[] = [];
    for (const file of incoming) {
      const problem = validateScreenshotFile(file);
      if (problem) {
        setFileError(problem);
        return; // Nothing is attached if any file is bad.
      }
      // §6: re-encode through a canvas so EXIF (including GPS) never leaves the
      // browser. Falls back to the original file if the browser can't decode it.
      accepted.push(await stripImageMetadata(file));
    }
    setScreenshots((current) => [...current, ...accepted]);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowErrors(true);
    if (!isValid || isSubmitting) return;
    onSubmit({
      type,
      title: title.trim(),
      description: description.trim(),
      ...(importance.trim() ? { importance: importance.trim() } : {}),
      ...(linkUrl.trim() ? { link_url: linkUrl.trim() } : {}),
      ...(type === 'bug' && sourcePath ? { source_path: sourcePath } : {}),
      screenshots,
    });
  }

  const rateLimited = submitError instanceof FeedbackApiError && submitError.status === 429;

  return (
    <div className="fb-modal__backdrop" onMouseDown={requestClose}>
      <div
        className="fb-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="fb-modal__head">
          <h2 id={titleId} className="fb-modal__title">
            Give feedback
          </h2>
          <button type="button" className="fb-modal__close" onClick={requestClose} aria-label="Close">
            ×
          </button>
        </header>

        <form className="fb-form" onSubmit={handleSubmit} noValidate>
          <fieldset className="fb-field">
            <legend className="fb-label">Type</legend>
            <div className="fb-segmented" role="group" aria-label="Feedback type" ref={typeGroupRef}>
              {TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`fb-segmented__btn ${type === option ? 'fb-segmented__btn--active' : ''}`}
                  aria-pressed={type === option}
                  onClick={() => setType(option)}
                >
                  {TYPE_LABELS[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="fb-field">
            <span className="fb-label">Title</span>
            <input
              className="fb-input"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={showErrors && Boolean(errors.title)}
              aria-describedby={showErrors && errors.title ? 'fb-title-error' : undefined}
            />
            {showErrors && errors.title && (
              <span className="fb-error" id="fb-title-error" role="alert">
                {errors.title}
              </span>
            )}
          </label>

          <label className="fb-field">
            <span className="fb-label">{DESCRIPTION_LABEL[type]}</span>
            <textarea
              className="fb-textarea"
              rows={5}
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={showErrors && Boolean(errors.description)}
              aria-describedby={showErrors && errors.description ? 'fb-desc-error' : undefined}
            />
            {showErrors && errors.description && (
              <span className="fb-error" id="fb-desc-error" role="alert">
                {errors.description}
              </span>
            )}
          </label>

          <div className="fb-field">
            {/* htmlFor, not a wrapping label: clicking a wrapped file input
                re-opens the picker from anywhere in the block. */}
            <label className="fb-label" htmlFor="fb-screenshot-input">
              Screenshot
            </label>
            <input
              id="fb-screenshot-input"
              type="file"
              className="fb-file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(event) => {
                void handleFiles(event.target.files);
                event.target.value = '';
              }}
              aria-describedby="fb-file-help"
            />
            <span className="fb-help" id="fb-file-help">
              Screenshots go to the PLAA team only.
            </span>
            {screenshots.length > 0 && (
              <ul className="fb-files">
                {screenshots.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="fb-files__row">
                    <span className="fb-files__name">{file.name}</span>
                    <button
                      type="button"
                      className="fb-files__remove"
                      onClick={() => setScreenshots((current) => current.filter((_, i) => i !== index))}
                      aria-label={`Remove ${file.name}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {fileError && (
              <span className="fb-error" role="alert">
                {fileError}
              </span>
            )}
          </div>

          <label className="fb-field">
            <span className="fb-label">Link (optional)</span>
            <input
              className="fb-input"
              value={linkUrl}
              placeholder="https://"
              onChange={(event) => setLinkUrl(event.target.value)}
              aria-invalid={showErrors && Boolean(errors.link)}
            />
            {showErrors && errors.link && (
              <span className="fb-error" role="alert">
                {errors.link}
              </span>
            )}
          </label>

          <label className="fb-field">
            <span className="fb-label">Why is this important? (optional)</span>
            <textarea
              className="fb-textarea"
              rows={3}
              value={importance}
              maxLength={IMPORTANCE_MAX}
              onChange={(event) => setImportance(event.target.value)}
            />
          </label>

          {type === 'bug' && (
            <p className="fb-note" data-testid="fb-bug-privacy-note">
              Bug reports are visible only to you and the PLAA team.
            </p>
          )}

          {/* Pending Legal review (Javier) before launch — §6. */}
          <p className="fb-guidelines" data-pending-legal-review="true">
            Posts are visible to PLAA members. Don&apos;t include personal or account details, balances, or anything
            confidential. Screenshots and bug reports are visible only to you and the PLAA team.
          </p>

          {submitError != null && (
            <p className="fb-error fb-error--block" role="alert">
              {rateLimited
                ? "You've hit today's submission limit. Try again tomorrow."
                : 'Something went wrong sending that. Try again.'}
            </p>
          )}

          <div className="fb-modal__actions">
            <button type="button" className="fb-btn fb-btn--ghost" onClick={requestClose}>
              Cancel
            </button>
            <button type="submit" className="fb-btn fb-btn--primary" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </form>

        {confirmingDiscard && (
          <div className="fb-confirm" role="alertdialog" aria-label="Discard this feedback?">
            <p className="fb-confirm__text">Discard what you&apos;ve written?</p>
            <div className="fb-modal__actions">
              <button type="button" className="fb-btn fb-btn--ghost" onClick={() => setConfirmingDiscard(false)}>
                Keep editing
              </button>
              <button type="button" className="fb-btn fb-btn--primary" onClick={onClose}>
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
