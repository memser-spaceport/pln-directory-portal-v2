'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

import { CommentIcon } from '@/components/icons';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';

import s from './FeedbackFab.module.scss';

/** How long the label stays before the pill settles to the glyph. */
const INTRO_MS = 2200;

interface Props {
  /** Comment mode is on: the press leaves it. */
  active: boolean;
  onToggle: () => void;
  /** Pins the viewer would see in comment mode — the author's queue, or your own. */
  count: number;
}

/**
 * Floating comment door for the app detail view. It opens saying its name and
 * then settles into a 48px glyph; pressing it enters comment mode on the app
 * (see `comments/CommentLayer`), and pressing it again leaves.
 *
 * It used to open the feedback form. The form is now the composer on a pin,
 * so the door's job changed from "open a dialog" to "switch the tool on" —
 * the way Figma's comment tool is a toggle in the toolbar, lit while it is the
 * active tool. That is why the active state is not a second control: one mark,
 * two states, and the tooltip names what the press will do in each.
 *
 * Why it floats here and not on the grid: the detail view is an embedded app
 * you are meant to *use*, and feedback is written while using it — so the
 * control has to stay reachable rather than live in a utility bar you scroll
 * past. The grid keeps its masthead button; one door per surface.
 *
 * Why the label is temporary: everything the control covers belongs to the app
 * underneath, so the *resting* state has to be the smallest mark that can still
 * be found. The name is spent once, on arrival, and then the space goes back to
 * the app. After that the tooltip and the accessible name carry it.
 *
 * `forceTooltip`, because CustomTooltip otherwise only speaks for truncated
 * text; here there is no text to truncate.
 */
export function FeedbackFab({ active, onToggle, count }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsCollapsed(true), INTRO_MS);
    return () => clearTimeout(timer);
  }, []);

  const label = active ? 'Done' : 'Give feedback';

  return (
    <div className={s.wrap} data-collapsed={isCollapsed && !active} data-active={active}>
      <CustomTooltip
        forceTooltip
        content={active ? 'Finish commenting' : 'Give feedback'}
        trigger={
          <button
            type="button"
            className={clsx(s.button, active && s.buttonActive)}
            aria-label={active ? 'Finish commenting' : 'Give feedback'}
            aria-pressed={active}
            onClick={onToggle}
          >
            {/* CommentIcon hardcodes its own 16px box and ignores props. One
                glyph in both states: the tool is the same tool, lit or not. */}
            <CommentIcon />
            <span className={s.label} aria-hidden>
              {label}
            </span>
            {/* The count rides the resting mark only — in comment mode the pins
                themselves are the count. */}
            {!active && count > 0 && (
              <span className={s.count} aria-label={`${count} comments`}>
                {count}
              </span>
            )}
          </button>
        }
      />
    </div>
  );
}
