'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { CloseIcon, CommentIcon } from '@/components/icons';
// Production stylesheet, verbatim: the 48px brand pill, the label that spends
// itself on arrival, the hover/focus peek.
import s from '@/components/page/ai-apps/components/FloatingFeedbackButton/FloatingFeedbackButton.module.scss';
// The feedback popover's card, header and ✕ — the comment card is the same card, smaller.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';

import { ProductionFeedbackDialog, type SubmittedFeedback } from './ProductionFeedbackDialog';
import type { AiAppWithDoc } from './mocks';
import { CAPTURE_IGNORE_ATTR } from './threads/nativeCapture';
import local from './FeedbackFab.module.scss';

/** How long the label stays before the pill settles to the glyph. */
const INTRO_MS = 2200;

interface CommentsProps {
  /** Comment mode is on. */
  active: boolean;
  onStart: () => void;
  onStop: () => void;
  /** Threads this viewer can see, shown on the resting bubble. */
  count: number;
}

interface Props {
  apps: AiAppWithDoc[];
  /** App page: preselects this app in the picker. */
  appUid?: string;
  appName?: string;
  onSubmit: (feedback: SubmittedFeedback) => void;
  viewerName?: string;
  /** Extra room on the right, so the door clears comment mode's drawer. */
  rightOffset?: number;
  /** Proposal only: the bubble also holds comment mode. Absent → production's button. */
  comments?: CommentsProps;
  /**
   * Proposal's feedback POC screenshots (native capture on open, Whole page /
   * Pick a part). Defaults to on whenever `comments` is passed; the grid sets it
   * on its own, since it has no comment mode.
   */
  nativeCapture?: boolean;
}

/**
 * COPY-SIMPLIFY of production `FloatingFeedbackButton` (main): the floating door
 * on both the grid and the app page, saying its name on arrival and then
 * settling to a 48px glyph, opening the anchored popover above itself. Keyed by
 * app so the intro replays when you move between apps, as production does.
 *
 * Proposal (`comments`): one door, two modes, each with a labelled way to the
 * other. The popover is production's feedback form, and its first row is a
 * full-width **Comment on the app** door (chat glyph, the count, a chevron).
 * Pressing it starts comment mode at once and the form shrinks to a small
 * "Commenting" card in the same corner: the one line the mode needs, who sees
 * it, and a **Back to feedback** button (✕ just stops commenting).
 *
 * It replaced a Feedback | Comment segmented switch in the popover's title.
 * Manager review: the switch made comments hard to find and Feedback hard to
 * get back to — a 26px segment in the header was the only door each way. Both
 * doors are now full-size, named controls in the body.
 *
 * The popover opens on Feedback: that is what the bubble is for today (158 sends
 * in 90 days), and comment mode changes what a click on the app does, which
 * nobody should get without choosing it. While commenting, the bubble is lit and
 * a press ends the mode.
 *
 * `nativeCapture` is separate from `comments`: the grid's bubble in Proposal
 * gets the same POC screenshots in its Feedback form, with no Comment mode.
 *
 * Dropped: the rbac gate (`canViewAiApps`) and analytics.
 */
export function FeedbackFab(props: Props) {
  // Keyed by capture mode too: the form keeps its screenshots between opens, so
  // flipping the review switch must start a fresh form rather than carry a
  // Proposal (native) screenshot into the Production form.
  const native = props.nativeCapture ?? !!props.comments;
  return <Fab key={`${props.appUid ?? 'list'}:${native ? 'native' : 'browser'}`} {...props} />;
}

function Fab({ apps, appUid, appName, onSubmit, viewerName, rightOffset = 0, comments, nativeCapture }: Props) {
  const [isOpen, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const active = !!comments?.active;

  // Paused while the popover is open — collapsing the anchor mid-use moves the panel.
  useEffect(() => {
    if (isOpen || isCollapsed) return;
    const timer = setTimeout(() => setIsCollapsed(true), INTRO_MS);
    return () => clearTimeout(timer);
  }, [isOpen, isCollapsed]);

  const wrapStyle = rightOffset ? { right: 24 + rightOffset, transition: 'right 0.3s ease-out' } : undefined;

  const startCommenting = () => {
    if (!comments) return;
    setOpen(false);
    comments.onStart();
  };

  const backToFeedback = () => {
    comments?.onStop();
    setOpen(true);
  };

  const onBubble = () => {
    if (active) comments?.onStop();
    else setOpen(true);
  };

  return (
    <>
      <div
        ref={wrapRef}
        className={s.wrap}
        // Our own chrome stays out of native screenshots.
        {...{ [CAPTURE_IGNORE_ATTR]: '' }}
        // Lit, the bubble stays a glyph: the card above it says what mode this is.
        data-collapsed={isCollapsed || active}
        style={wrapStyle}
      >
        <button
          type="button"
          className={clsx(s.button, local.trigger, active && local.buttonActive)}
          aria-label={active ? 'Finish commenting' : comments ? 'Feedback and comments' : 'Give feedback'}
          aria-pressed={comments ? active : undefined}
          onClick={onBubble}
        >
          <CommentIcon />
          <span className={s.label} aria-hidden>
            {comments ? 'Feedback & comments' : 'Give feedback'}
          </span>
          {/* The count rides the resting bubble only — in comment mode the pins are the count. */}
          {comments && !active && comments.count > 0 && (
            <span className={local.count} aria-hidden>
              {comments.count}
            </span>
          )}
        </button>
      </div>

      <ProductionFeedbackDialog
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        apps={apps}
        appUid={appUid}
        appName={appName}
        anchorRef={wrapRef}
        placement="above"
        onSubmit={onSubmit}
        viewerName={viewerName}
        topSlot={
          comments ? (
            <button type="button" className={local.commentDoor} onClick={startCommenting}>
              <span className={local.commentDoorIcon} aria-hidden>
                <CommentIcon />
              </span>
              <span className={local.commentDoorText}>
                <span className={local.commentDoorTitle}>
                  Comment on the app
                  {comments.count > 0 && <span className={local.commentDoorCount}>{comments.count}</span>}
                </span>
                <span className={local.commentDoorSub}>Click any spot to leave a comment right there</span>
              </span>
              <ChevronIcon />
            </button>
          ) : undefined
        }
        nativeCapture={nativeCapture ?? !!comments}
      />

      {comments && active && (
        <div
          className={clsx(fd.root, local.commentCard)}
          style={{ right: 24 + rightOffset }}
          role="status"
          {...{ [CAPTURE_IGNORE_ATTR]: '' }}
        >
          <div className={clsx(fd.header, local.commentHead)}>
            <h2 className={clsx(fd.title, local.commentTitle)}>Commenting</h2>
            <button type="button" className={fd.closeButton} onClick={comments.onStop} aria-label="Stop commenting">
              <CloseIcon width={16} height={16} />
            </button>
          </div>
          <p className={local.commentHint}>Click anywhere on the app to leave a comment.</p>
          <p className={local.commentAudience}>Only the app&apos;s author and admins see it.</p>
          <div className={local.commentFoot}>
            <Button style="border" variant="neutral" size="s" className={local.backButton} onClick={backToFeedback}>
              <BackIcon />
              Back to feedback
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/* Same 16px / 1.4 stroke family as the dialog's camera glyph. */
function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={local.commentDoorChevron}>
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10 3.5 5.5 8 10 12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
