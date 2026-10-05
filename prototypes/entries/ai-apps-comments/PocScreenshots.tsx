'use client';

import clsx from 'clsx';

import { CloseIcon, PencilSimpleLineIcon } from '@/components/icons';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';
import { AnnotationCanvas } from '@/components/page/ai-apps/components/screenshot-feedback/AnnotationCanvas';
import { hasAnyAnnotation, type ScreenshotAttachment } from '@/components/page/ai-apps/components/screenshot-feedback';
// Production feedback dialog: its field label and its screenshot button.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';

import s from './PocScreenshots.module.scss';

export type ShotSource = 'auto' | 'page' | 'part';

export interface PocShot extends ScreenshotAttachment {
  source: ShotSource;
  /** The reporter said the automatic redraw doesn't match what they see. */
  misaligned?: boolean;
}

const SOURCE_LABEL: Record<ShotSource, string> = {
  auto: 'Automatic capture may not be exact.',
  page: 'Whole page',
  part: 'Part of the page',
};

interface Props {
  shots: PocShot[];
  /** The automatic capture is still being taken. */
  autoPending: boolean;
  busy: boolean;
  onAnnotate: (shot: PocShot) => void;
  onRemove: (shot: PocShot) => void;
  onToggleMisaligned: (shot: PocShot) => void;
  onWholePage: () => void;
  onPickPart: () => void;
}

/**
 * The feedback POC's screenshots, after feedback-dev-kit's panel
 * (jbenet/feedback-dev-kit, docs/screenshots/02-drawer.png):
 *
 * - **Automatic capture.** The popover photographs the page behind it when it
 *   opens — no button, no prompt — leaving itself out. Because it is a redraw it
 *   can be subtly off, so it says so ("Automatic capture may not be exact.") and
 *   offers **Misaligned? Tell us**, which marks it ("Misaligned · noted") and
 *   travels with the report as evidence about the capture.
 * - **Annotate / ✕** on every picture's corner; pressing the picture annotates
 *   too. Annotations show on the preview, so nothing drawn is out of sight.
 * - **Two buttons that add, never replace** — a second picture is a second
 *   piece of evidence, and one already annotated must not vanish:
 *   **Whole page** (the full page, scrolled-away parts included) and **Pick a
 *   part** (drag over the live page). Both native: our own redraw, no browser
 *   share prompt. (The kit's Whole page is the browser's screen capture; ours
 *   are native by decision.)
 */
export function PocScreenshots(props: Props) {
  const { shots, autoPending, busy, onAnnotate, onRemove, onToggleMisaligned, onWholePage, onPickPart } = props;
  const count = shots.length + (autoPending ? 1 : 0);

  return (
    <div className={s.section}>
      <p className={fd.fieldLabel}>Screenshots{count > 0 && <span className={s.count}> · {count}</span>}</p>

      {autoPending && (
        <div className={clsx(s.card, s.pending)} aria-busy="true" aria-label="Taking a screenshot of the page" />
      )}

      {shots.map((shot, index) => {
        const annotated = hasAnyAnnotation(shot.annotations);
        return (
          <div key={shot.id} className={s.item}>
            <div className={s.card}>
              <button
                type="button"
                className={s.open}
                onClick={() => onAnnotate(shot)}
                aria-label={`Annotate screenshot ${index + 1}`}
              >
                {annotated ? (
                  <AnnotationCanvas
                    className={s.canvas}
                    imageSrc={shot.imageDataUrl}
                    annotations={shot.annotations}
                    readOnly
                  />
                ) : (
                  <img src={shot.imageDataUrl} alt={`Screenshot ${index + 1}`} />
                )}
              </button>
              <div className={s.corner}>
                <button type="button" className={s.annotate} onClick={() => onAnnotate(shot)}>
                  <PencilSimpleLineIcon width={14} height={14} />
                  Annotate
                </button>
                <button
                  type="button"
                  className={s.remove}
                  onClick={() => onRemove(shot)}
                  aria-label={`Remove screenshot ${index + 1}`}
                >
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
            </div>
            <div className={s.caption}>
              <span className={s.source}>{SOURCE_LABEL[shot.source]}</span>
              {shot.source === 'auto' && (
                <CustomTooltip
                  forceTooltip
                  content="The automatic screenshot is a redraw of the page, so spacing, wrapping or a control can come out slightly wrong. Tell us and we'll know. Whole page or Pick a part take a fresh one."
                  trigger={
                    <button
                      type="button"
                      className={clsx(s.misaligned, shot.misaligned && s.misalignedOn)}
                      aria-pressed={!!shot.misaligned}
                      onClick={() => onToggleMisaligned(shot)}
                    >
                      {shot.misaligned ? 'Misaligned · noted' : 'Misaligned? Tell us'}
                    </button>
                  }
                />
              )}
            </div>
          </div>
        );
      })}

      <div className={s.actions}>
        <button type="button" className={fd.screenshotButton} onClick={onWholePage} disabled={busy}>
          <CameraIcon />
          Whole page
        </button>
        <button type="button" className={fd.screenshotButton} onClick={onPickPart} disabled={busy}>
          <CrosshairIcon />
          Pick a part
        </button>
      </div>
    </div>
  );
}

/* Production's camera, from the feedback dialog's Take screenshot — the glyph
   this product already uses for "take a screenshot". */
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

/* Same 16px / 1.4 stroke family as the camera beside it. */
function CrosshairIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="4.75" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
