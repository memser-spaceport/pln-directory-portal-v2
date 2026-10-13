'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { CloseIcon, CommentIcon } from '@/components/icons';
// Production stylesheet, verbatim: the 48px brand pill, the label that spends
// itself on arrival, the hover/focus peek.
import s from '@/components/page/ai-apps/components/FloatingFeedbackButton/FloatingFeedbackButton.module.scss';
// The feedback popover's card, header and ✕ — the comment card is the same card, smaller.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
// The product's segmented control (Updates panel: All / Unread / Read).
import vs from '@/components/core/UpdatesPanel/ViewSwitch/ViewSwitch.module.scss';

import { ProductionFeedbackDialog, type SubmittedFeedback } from './ProductionFeedbackDialog';
import type { AiAppWithDoc } from './mocks';
import { CAPTURE_IGNORE_ATTR } from './threads/nativeCapture';
import local from './FeedbackFab.module.scss';

/** How long the label stays before the pill settles to the glyph. */
const INTRO_MS = 2200;

type Mode = 'comment' | 'feedback';

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
}

/**
 * COPY-SIMPLIFY of production `FloatingFeedbackButton` (main): the floating door
 * on both the grid and the app page, saying its name on arrival and then
 * settling to a 48px glyph, opening the anchored popover above itself. Keyed by
 * app so the intro replays when you move between apps, as production does.
 *
 * Proposal (`comments`): one door, two modes, switched in place. The popover's
 * title becomes a Feedback | Comment switch (the Updates panel's segmented
 * control). Feedback is production's form. Comment puts the app into comment
 * mode at once — the press completes the action — and the form shrinks to a
 * small card in the same corner, carrying the same switch, the one line the
 * mode needs ("Click anywhere on the app…") and the ✕ that ends it. That card
 * is the mode's only chrome; the switch never moves, so going back to Feedback
 * is the same press in the same place.
 *
 * The popover opens on Feedback: that is what the bubble is for today (158 sends
 * in 90 days), and comment mode changes what a click on the app does, which
 * nobody should get without choosing it. While commenting, the bubble is lit and
 * a press ends the mode.
 *
 * Dropped: the rbac gate (`canViewAiApps`) and analytics.
 */
export function FeedbackFab(props: Props) {
  return <Fab key={props.appUid ?? 'list'} {...props} />;
}

function Fab({ apps, appUid, appName, onSubmit, viewerName, rightOffset = 0, comments }: Props) {
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

  const switchTo = (mode: Mode) => {
    if (!comments) return;
    if (mode === 'comment') {
      setOpen(false);
      comments.onStart();
    } else {
      comments.onStop();
      setOpen(true);
    }
  };

  const modeSwitch = (mode: Mode) =>
    comments ? <ModeSwitch mode={mode} count={comments.count} onChange={switchTo} /> : undefined;

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
        headerSlot={modeSwitch('feedback')}
        nativeCapture={!!comments}
      />

      {comments && active && (
        <div
          className={clsx(fd.root, local.commentCard)}
          style={{ right: 24 + rightOffset }}
          role="status"
          {...{ [CAPTURE_IGNORE_ATTR]: '' }}
        >
          <div className={clsx(fd.header, local.commentHead)}>
            {modeSwitch('comment')}
            <button type="button" className={fd.closeButton} onClick={comments.onStop} aria-label="Stop commenting">
              <CloseIcon width={16} height={16} />
            </button>
          </div>
          <p className={local.commentHint}>Click anywhere on the app to leave a comment.</p>
          <p className={local.commentAudience}>Only the app&apos;s author and admins see it.</p>
        </div>
      )}
    </>
  );
}

interface ModeSwitchProps {
  mode: Mode;
  count: number;
  onChange: (mode: Mode) => void;
}

/** Feedback | Comment, in the Updates panel's segmented control. */
function ModeSwitch({ mode, count, onChange }: ModeSwitchProps) {
  // Feedback first — the popover's default and today's job — Comment second,
  // marked with the chat glyph the bubble itself wears.
  const options: { value: Mode; label: string }[] = [
    { value: 'feedback', label: 'Feedback' },
    { value: 'comment', label: 'Comment' },
  ];
  return (
    <div className={clsx(vs.segmented, local.switch)} role="tablist" aria-label="How to respond">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={mode === opt.value}
          className={vs.segmentedBtn}
          onClick={() => opt.value !== mode && onChange(opt.value)}
        >
          {opt.value === 'comment' && (
            <span className={local.switchIcon} aria-hidden>
              <CommentIcon />
            </span>
          )}
          {opt.label}
          {opt.value === 'comment' && count > 0 && <span className={vs.segmentCount}>{count}</span>}
        </button>
      ))}
    </div>
  );
}
