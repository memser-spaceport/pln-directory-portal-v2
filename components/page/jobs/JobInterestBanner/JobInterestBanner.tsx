'use client';

import clsx from 'clsx';

import btn from '@/components/common/Button/Button.module.scss';
import { InfoCircleIconOutlined, SuccessCircleIcon } from '@/components/icons';

import s from './JobInterestBanner.module.scss';

/**
 * A light signal beside Apply: "let this team know you're interested".
 *
 * Sits between the job masthead and "About the role", which is where the design
 * puts it and — because those sections are siblings in `JobDetailPane`'s
 * fragment — the only place it can go without taking the column's 16px gap away
 * from its neighbours.
 *
 * **Two states drawn as two components, rendered as one.** The design has a
 * blue-tinted card with a 128x40 outlined button, and a green success alert with
 * an underlined "Undo" link. They swap surface, icon, title and action — but the
 * action stays one `<button>` element that changes its classes and its label,
 * never two that replace each other.
 *
 * That is not a shortcut, it is the accessibility fix: unmounting the pressed
 * control drops focus to `<body>`, so a keyboard user loses their place in a
 * thousand-pixel description and a screen-reader user hears nothing at all.
 * Keeping the node means focus survives the toggle for free and the new label is
 * announced because it is the focused element. Do not "clean this up" into two
 * conditional buttons.
 *
 * The text block is an `aria-live` region so the title change is heard by
 * someone who pressed with the mouse and is not focused here.
 *
 * **The title is a `<p>`, not a heading.** The review step already has one `<h1>`
 * (the role) and, for logged-out visitors, one `<h2>` (`JobUnlockBanner`, which
 * this now stacks above). A third heading here would put a second "what this
 * role wants from you" landmark in a document that gains nothing from it.
 *
 * Auth is not this component's business: `isLoggedIn` only picks a sentence, and
 * the press is handed up. The drawer decides whether a press means a mutation or
 * a trip to Privy, the same way it decides every other auth-dependent affordance
 * in this flow.
 */

export const INTEREST_CTA_LABEL = "I'm interested";
export const INTEREST_UNDO_LABEL = 'Undo';
export const INTEREST_CONFIRMED_TITLE = 'Team will be notified you are interested';

export const interestPromptTitle = (teamName: string) => `Let ${teamName} know you're interested`;

/* Logged in, the profile exists and sharing it is the whole offer. Logged out it
   does not, and the design's sentence ("We'll share your LabOS profile…") would
   be describing something the person does not have — the same class of claim
   this drawer has already reworded twice rather than ship. The press really does
   open an account first, so the copy says so. */
export const INTEREST_SUBTITLE_MEMBER = "We'll share your LabOS profile so they can reach out.";
export const INTEREST_SUBTITLE_VISITOR = "Sign in and we'll share your profile so they can reach out.";

interface JobInterestBannerProps {
  teamName: string;
  isInterested: boolean;
  isLoggedIn: boolean;
  /** The server's own message when the last toggle failed. Replaces the subtitle. */
  error: string | null;
  onToggle: (nextInterested: boolean) => void;
}

export function JobInterestBanner(props: JobInterestBannerProps) {
  const { teamName, isInterested, isLoggedIn, error, onToggle } = props;

  const title = isInterested ? INTEREST_CONFIRMED_TITLE : interestPromptTitle(teamName);
  const subtitle = isLoggedIn ? INTEREST_SUBTITLE_MEMBER : INTEREST_SUBTITLE_VISITOR;

  return (
    <div className={clsx(s.root, isInterested && s.confirmed)}>
      <span className={s.iconTile} aria-hidden="true">
        {isInterested ? <SuccessCircleIcon width={24} height={24} /> : <InfoCircleIconOutlined width={20} height={20} />}
      </span>

      <div className={s.text} aria-live="polite">
        <p className={s.title}>{title}</p>
        {/* One slot, three things it can say: the offer, the correction, or —
            once the signal is in — nothing, because the title is the whole
            message and a subtitle under it would be padding. */}
        {error ? <p className={s.error}>{error}</p> : !isInterested && <p className={s.subtitle}>{subtitle}</p>}
      </div>

      <button
        type="button"
        onClick={() => onToggle(!isInterested)}
        className={clsx(
          s.action,
          isInterested ? clsx(btn.root, btn.small, btn.link, btn.success, btn.underline) : clsx(btn.root, btn.medium, btn.border, btn.primary),
        )}
      >
        {isInterested ? INTEREST_UNDO_LABEL : INTEREST_CTA_LABEL}
      </button>
    </div>
  );
}
