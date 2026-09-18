'use client';

import clsx from 'clsx';

import btn from '@/components/common/Button/Button.module.scss';
import { Checkbox } from '@/components/common/Checkbox';
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
 * (the role). A second heading here would put another "what this role wants from
 * you" landmark in a document that gains nothing from it.
 *
 * Auth is not this component's business: the press is handed up, and the drawer
 * decides whether it means a mutation or a trip to Privy, the same way it
 * decides every other auth-dependent affordance in this flow. It takes no
 * `isLoggedIn` — a signed-out visitor is never wired this banner at all
 * (`canShowJobInterest`), so the two-sentence split this used to carry was
 * describing a state production cannot reach.
 */

export const INTEREST_CTA_LABEL = "I'm interested";
export const INTEREST_UNDO_LABEL = 'Undo';

/**
 * What pressing this actually does, in words — and the constraint on changing
 * them. **LAB-2596 owns the wording; this rule owns the claim.**
 *
 * **No sentence here may name a recipient or a delivery event.** Marking
 * interest writes one `JobOpeningInterest` row (backend
 * `job-openings-interest.service.ts`) and does nothing else: no email, no
 * notification, no push, no ATS, and no endpoint through which a team could
 * read it. The strings below may describe a record being kept, its scope (this
 * role), and that Undo removes it. That is the whole set of true things.
 *
 * These used to say *"We'll notify the team if you're a match"* and *"The team
 * will see it if you're a match"*, which is the false promise LAB-2573 was
 * opened to remove. Its own suggested replacements — interest going "directly
 * to the ATS" for Protocol Labs, teams seeing interested members "on their
 * Hiring tab" — name two more recipients that do not exist either, so they are
 * not here.
 *
 * **Do not reword these back toward a promise when the feature seems to grow
 * one.** If interest is to reach a team, that becomes true in the flow first,
 * and these sentences follow it. Compare `JobUnlock/unlockCopy.ts`, whose copy
 * is design-owned for the opposite reason and carries the opposite instruction.
 */
export const INTEREST_SUBTITLE = "We'll note your interest in this role. You can undo it any time.";
export const INTEREST_CONFIRMED_TITLE = 'Your interest is recorded';

/* Left as it was, and raised on LAB-2596 rather than reworded here: "let them
   know" is also a delivery claim by the rule above, but it is the banner's ask
   and its whole reason for existing, so replacing it is the design's call and
   not a local correctness fix. */
export const interestPromptTitle = (teamName: string) => `Let ${teamName} know you're interested`;

/** The follow offer carried beside the press that sends something to a team —
 *  this banner's row and the apply footer's tick share one sentence. */
export const teamFollowOfferLabel = (teamName: string) => `Follow ${teamName} to hear when they post or hire`;

interface JobInterestBannerProps {
  teamName: string;
  isInterested: boolean;
  /** The server's own message when the last toggle failed. Replaces the subtitle. */
  error: string | null;
  /**
   * The follow offer, drawn under the subtitle while the signal is still to be
   * sent. Absent when the viewer already follows the team — there is nothing
   * left to offer — and once the signal is in, because the footer of that
   * state is Undo and there is no press for the tick to ride.
   */
  follow?: {
    checked: boolean;
    onChange: (next: boolean) => void;
  };
  /** `followTeam` is the follow row's tick at press time: true when marking
   *  interest should also follow the team. Meaningless on Undo.
   *  `followOffered` is whether the tick was on screen for this press. */
  onToggle: (nextInterested: boolean, followTeam: boolean, followOffered?: boolean) => void;
}

export function JobInterestBanner(props: JobInterestBannerProps) {
  const { teamName, isInterested, error, follow, onToggle } = props;

  const title = isInterested ? INTEREST_CONFIRMED_TITLE : interestPromptTitle(teamName);

  return (
    <div className={clsx(s.root, isInterested && s.confirmed)}>
      <span className={s.iconTile} aria-hidden="true">
        {isInterested ? (
          <SuccessCircleIcon width={24} height={24} />
        ) : (
          <InfoCircleIconOutlined width={20} height={20} />
        )}
      </span>

      <div className={s.text} aria-live="polite">
        <p className={s.title}>{title}</p>
        {/* One slot, three things it can say: the offer, the correction, or —
            once the signal is in — nothing, because the title is the whole
            message and a subtitle under it would be padding. */}
        {error ? (
          <p className={s.error}>{error}</p>
        ) : (
          !isInterested && <p className={s.subtitle}>{INTEREST_SUBTITLE}</p>
        )}
        {!isInterested && follow && (
          <label className={s.follow}>
            <Checkbox checked={follow.checked} onChange={follow.onChange} />
            <span>{teamFollowOfferLabel(teamName)}</span>
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          onToggle(!isInterested, !isInterested && (follow?.checked ?? false), Boolean(follow) && !isInterested)
        }
        className={clsx(
          s.action,
          isInterested
            ? clsx(btn.root, btn.small, btn.link, btn.success, btn.underline)
            : clsx(btn.root, btn.medium, btn.border, btn.primary),
        )}
      >
        {isInterested ? INTEREST_UNDO_LABEL : INTEREST_CTA_LABEL}
      </button>
    </div>
  );
}
