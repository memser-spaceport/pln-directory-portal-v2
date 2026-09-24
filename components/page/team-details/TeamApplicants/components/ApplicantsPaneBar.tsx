'use client';

import clsx from 'clsx';

import { CaretLeftIcon } from '@/components/icons/CaretLeftIcon';
import { CaretRightIcon } from '@/components/icons/CaretRightIcon';
import { EnvelopeIcon, ReviewCheckIcon } from '@/components/icons';
import type { TeamApplicant } from '@/schema/team-applicants';

import s from './ApplicantsPaneBar.module.scss';

interface Props {
  applicant: TeamApplicant;
  roleTitle: string;
  /** Zero-based, within the list as it is currently filtered. */
  position: number;
  total: number;
  onStep: (delta: number) => void;
  onToggleReviewed: () => void;
}

/**
 * One bar above the pane: where you are, how to move, and the reply.
 *
 * At fifty applicants the question after reading one person is "how many left,
 * and next" — and the list beside the pane answers it only by scrolling back to
 * find the row you were on. Every ATS reference pins this somewhere: Wellfound
 * heads its pane with "1 of 26", Workable and Homerun show "2 of 4" with arrows.
 *
 * **Above the profile card rather than inside it**, so the card stays the member
 * page's own. And sticky, because the actions used to sit at the foot of the
 * application and went out of reach the moment the lead scrolled to Experience
 * to check what the note claimed.
 *
 * **Email is the only thing the team does with an application here.** There is
 * no Shortlist or Reject: this product replies by email — the apply flow's own
 * promise is that the team can reply directly — so the list is a record of who
 * applied, not a board to move people across.
 */
export function ApplicantsPaneBar({ applicant, roleTitle, position, total, onStep, onToggleReviewed }: Props) {
  const firstName = applicant.name.split(' ')[0] || applicant.name;
  const subject =
    applicant.kind === 'application' ? `Your application for ${roleTitle}` : `Your interest in ${roleTitle}`;

  return (
    <div className={s.root}>
      <div className={s.nav}>
        <button
          type="button"
          className={s.stepBtn}
          aria-label="Previous applicant"
          disabled={position <= 0}
          onClick={() => onStep(-1)}
        >
          <CaretLeftIcon width={16} height={16} />
        </button>
        <button
          type="button"
          className={s.stepBtn}
          aria-label="Next applicant"
          disabled={position < 0 || position >= total - 1}
          onClick={() => onStep(1)}
        >
          <CaretRightIcon width={16} height={16} />
        </button>
        {/* Announced, because stepping swaps the whole pane with no other
            signal that anything moved. */}
        <span className={s.position} role="status" aria-live="polite">
          {position + 1} of {total}
        </span>
      </div>

      <div className={s.actions}>
        {/* The button turns into the state itself rather than sitting beside a
            separate mark — the same switch shape as a listing's Mark inactive /
            Bring back. No confirm, because the undo is the button it became. */}
        <button
          type="button"
          className={clsx(s.reviewBtn, applicant.reviewed && s.isReviewed)}
          aria-pressed={applicant.reviewed}
          title={applicant.reviewed ? 'Press to unmark' : undefined}
          onClick={onToggleReviewed}
        >
          <ReviewCheckIcon size={16} state={applicant.reviewed ? 'filled' : 'outline'} />
          {applicant.reviewed ? 'Reviewed' : 'Mark as reviewed'}
        </button>

        {/* No address, no button. A mail link that opens an empty compose window
            is worse than the absence, because it looks like the team has a way
            to reach this person. */}
        {applicant.email && (
          <a className={s.emailBtn} href={`mailto:${applicant.email}?subject=${encodeURIComponent(subject)}`}>
            <EnvelopeIcon size={14} />
            Email {firstName}
          </a>
        )}
      </div>
    </div>
  );
}
