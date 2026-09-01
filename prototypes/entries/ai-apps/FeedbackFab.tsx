'use client';

import { useEffect, useState } from 'react';

import { CommentIcon } from '@/components/icons';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';

import { GiveFeedbackDialog } from './GiveFeedbackDialog';
import type { AiAppWithDoc } from './mocks';
import s from './FeedbackFab.module.scss';

/** How long the label stays before the pill settles to the glyph. */
const INTRO_MS = 2200;

interface Props {
  apps: AiAppWithDoc[];
  /** Preselects this app in the dialog's picker (the detail view always passes one). */
  appUid: string;
  appName: string;
  onSubmit: (appUid: string, appName: string, text: string) => void;
}

/**
 * Floating "Give feedback" door for the app detail view. It opens saying its
 * name and then settles into a 48px glyph.
 *
 * Why it floats here and not on the grid: the detail view is an embedded app
 * you are meant to *use*, and feedback is written while using it — so the
 * control has to stay reachable rather than live in a utility bar you scroll
 * past. The grid keeps its masthead button; one door per surface, which is the
 * rule that took this off the detail page's top bar.
 *
 * Why the label is temporary: everything the control covers belongs to the app
 * underneath, so the *resting* state has to be the smallest mark that can still
 * be found. But a bare glyph in a corner has to be guessed at once, by everyone,
 * and the cheapest place to answer that is on arrival — the name is spent once,
 * at the moment the page is new, and then the space goes back to the app. After
 * that the tooltip and the accessible name carry it; nothing is ever hidden
 * behind a press.
 *
 * The timer runs per mount, so opening another app plays it again. That is the
 * same event from the reader's side (a page they just opened) and it keeps the
 * prototype demonstrable — a once-per-browser flag would show it to nobody.
 *
 * `forceTooltip`, because CustomTooltip otherwise only speaks for truncated
 * text; here there is no text to truncate. It stays mounted across the collapse
 * rather than switching on afterwards: flipping that prop swaps the whole
 * trigger tree, which would remount the button mid-transition and cut the
 * animation.
 *
 * Both doors mount the same `GiveFeedbackDialog`, so nothing about the form can
 * drift between them.
 */
export function FeedbackFab({ apps, appUid, appName, onSubmit }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsCollapsed(true), INTRO_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className={s.wrap} data-collapsed={isCollapsed}>
        <CustomTooltip
          forceTooltip
          content="Give feedback"
          trigger={
            <button type="button" className={s.button} aria-label="Give feedback" onClick={() => setIsOpen(true)}>
              {/* CommentIcon hardcodes its own 16px box and ignores props. */}
              <CommentIcon />
              <span className={s.label} aria-hidden>
                Give feedback
              </span>
            </button>
          }
        />
      </div>

      <GiveFeedbackDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        apps={apps}
        appUid={appUid}
        appName={appName}
        onSubmit={onSubmit}
      />
    </>
  );
}
