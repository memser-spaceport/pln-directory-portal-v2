'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { Button } from '@/components/common/Button/Button';
import { CloseIcon, PencilSimpleLineIcon } from '@/components/icons';
import { toast } from '@/components/core/ToastContainer';
import { RegionSelectOverlay, type AnnotationState } from '@/components/page/ai-apps/components/screenshot-feedback';
// The feedback dialog's card (radius, shadow), footer rule, and its screenshot
// button and strip — the same attach control and chip feedback uses.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';

// The shared pin popover's card and field, so a new comment and the thread it
// becomes are the same card in two states.
import pt from '../../feedback-shared/comments/PinThread.module.scss';
import pc from '../../feedback-shared/comments/PinComposer.module.scss';
import { FormProvider, useForm } from 'react-hook-form';
import { FormSelect } from '@/components/form/FormSelect/FormSelect';
import { DEFAULT_PRIORITY, DEFAULT_REPORT_KIND, PRIORITY_OPTIONS, REPORT_KIND_OPTIONS } from '../prod/FeedbackDialog';
// The feedback form's Kind | Priority row (two equal columns), reused as is.
import polish from '../prod/FeedbackPolish.module.scss';
import { CommentAnnotator } from './CommentAnnotator';
import { CAPTURE_IGNORE_ATTR, captureViewport } from './nativeCapture';
import type { Attachment, Triage } from './useThreads';
import s from './CommentComposer.module.scss';

type TriageForm = { reportKind: { label: string; value: string }; priority: { label: string; value: string } };

const MAX_LENGTH = 5000;

interface Props {
  text: string;
  onText: (text: string) => void;
  attachment: Attachment | null;
  onAttachment: (attachment: Attachment | null) => void;
  onCancel: () => void;
  onPost: (triage: Triage) => void;
  style?: React.CSSProperties;
  flip: boolean;
}

/**
 * The box you write in after clicking a spot on the app — Figma's comment
 * composer. A field, an optional screenshot, and Post.
 *
 * "Screenshot" takes a native one — rendered by our own code (`nativeCapture`),
 * no browser share prompt — then production's pieces take over: the page
 * freezes, you drag the area you mean, and the annotator opens on it (draw, box,
 * oval, arrow, numbered notes, undo — `CommentAnnotator`, production's annotator
 * saying "comment" where it says "feedback"). The card steps out of the way
 * while the frame is grabbed, so it is not in its own picture; the pin stays,
 * because it marks the spot. Adding it puts the feedback strip's chip in the
 * card: press to draw more, ✕ to take it off.
 *
 * Because nothing is asked of the browser, it works on phones too — unlike
 * production's tab capture, which has to hide its button there.
 *
 * The line by the buttons is the audience — everyone who can open the app, as
 * production made comments public — because nothing else on screen says who
 * reads a comment left on someone else's app.
 */
export function CommentComposer(props: Props) {
  const { text, onText, attachment, onAttachment, onCancel, onPost, style, flip } = props;
  const ref = useRef<HTMLTextAreaElement>(null);
  /** The frame is being grabbed: the card hides so it isn't in the shot. */
  const [capturing, setCapturing] = useState(false);
  /** The frozen page, waiting for the drag. */
  const [freezeSrc, setFreezeSrc] = useState<string | null>(null);
  /** The annotator is open on this image: a fresh crop, or the attached one to edit. */
  const [editorSrc, setEditorSrc] = useState<string | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  /* Kind and Priority (2026-10-06): the feedback form's triage, same defaults. */
  const triageForm = useForm<TriageForm>({
    defaultValues: { reportKind: DEFAULT_REPORT_KIND, priority: DEFAULT_PRIORITY },
  });
  const submit = () => {
    const { reportKind, priority } = triageForm.getValues();
    onPost({
      kind: reportKind?.value ?? DEFAULT_REPORT_KIND.value,
      priority: priority?.value ?? DEFAULT_PRIORITY.value,
    });
  };

  const canPost = text.trim().length > 0;
  const busy = capturing || !!freezeSrc;

  const takeScreenshot = async () => {
    flushSync(() => setCapturing(true));
    try {
      setFreezeSrc(await captureViewport());
    } catch {
      toast.error('Could not capture a screenshot. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div
      className={clsx(fd.root, pt.card, flip && pt.flip, busy && s.stepAside)}
      style={style}
      // Not in its own picture.
      {...{ [CAPTURE_IGNORE_ATTR]: '' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={clsx(pc.field, s.field)}>
        <textarea
          ref={ref}
          className={pt.textarea}
          rows={3}
          maxLength={MAX_LENGTH}
          placeholder="Add a comment"
          value={text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && canPost) {
              e.preventDefault();
              submit();
            }
          }}
        />

        {attachment ? (
          <ul className={clsx(fd.screenshotList, s.strip)}>
            <li className={fd.screenshotChip}>
              <button
                type="button"
                className={fd.screenshotOpen}
                aria-label="Edit screenshot"
                onClick={() => setEditorSrc(attachment.src)}
              >
                <img src={attachment.src} alt="Screenshot" />
                <span className={fd.screenshotEdit} aria-hidden="true">
                  <PencilSimpleLineIcon width={14} height={14} />
                </span>
              </button>
              <button
                type="button"
                className={fd.screenshotRemove}
                aria-label="Remove screenshot"
                onClick={() => onAttachment(null)}
              >
                <CloseIcon width={12} height={12} />
              </button>
            </li>
          </ul>
        ) : (
          <button
            type="button"
            className={clsx(fd.screenshotButton, s.attach)}
            onClick={takeScreenshot}
            disabled={capturing}
          >
            <CameraIcon />
            {capturing ? 'Capturing…' : 'Screenshot'}
          </button>
        )}

        {/* Kind | Priority, the feedback form's triage row (2026-10-06). */}
        <FormProvider {...triageForm}>
          <div className={clsx(polish.triage, s.triage)}>
            <div className={polish.kind}>
              <FormSelect
                name="reportKind"
                label="Kind"
                placeholder="Kind"
                options={REPORT_KIND_OPTIONS}
                menuPortalTarget={typeof document === 'undefined' ? null : document.body}
              />
            </div>
            <div className={polish.priority}>
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
      </div>

      <div className={clsx(fd.footer, pt.footer, s.footer)}>
        <span className={s.audience}>Everyone who can open this app can see it</span>
        <Button style="border" variant="neutral" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="xs" disabled={!canPost} onClick={submit}>
          Post
        </Button>
      </div>

      {/* Both portal to the body; rendered here so their React clicks bubble to
          this card's stopPropagation, not to the comment layer underneath. */}
      {freezeSrc && (
        <RegionSelectOverlay
          freezeSrc={freezeSrc}
          onSelect={(crop) => {
            setFreezeSrc(null);
            setEditorSrc(crop);
          }}
          onCancel={() => setFreezeSrc(null)}
        />
      )}
      {editorSrc && (
        <CommentAnnotator
          imageSrc={editorSrc}
          initialAnnotations={attachment?.src === editorSrc ? attachment.annotations : undefined}
          onDiscard={() => setEditorSrc(null)}
          onAdd={(annotations: AnnotationState) => {
            onAttachment({ src: editorSrc, annotations });
            setEditorSrc(null);
          }}
        />
      )}
    </div>
  );
}

/* Production's camera, from the feedback dialog. */
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
