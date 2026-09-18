'use client';

import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import btn from '@/components/common/Button/Button.module.scss';
import { CheckIcon } from '@/components/icons';

// The posting row's own stylesheet, unchanged — same inset, same body and action
// slots, so this line sits in the same column as the role titles above it.
import s from '../ReferRoleRow/ReferRoleRow.module.scss';
import local from './OpenRoleRow.module.scss';

/**
 * A team's standing invitation to people it has no posting for.
 *
 * The board answers one question well ("is there a role here for me?") and had
 * no answer at all when the honest reply is no: every control on a card is
 * attached to a specific posting, so a reader who wants to work at Protocol Labs
 * and matches none of its openings had nothing to press. This is the row they
 * press. Pressing files them in the team's ATS as a talent-pool entry, with the
 * profile and CV their account already holds.
 *
 * **It borrows the posting row's structure and drops what a posting fills it
 * with** — no box, no meta line, no clock, no `New`, no Refer, no link out. What
 * is left is one line and one button. The meta slot carries the *offer* instead
 * of facts, because the row's whole job is to ask a question and the reader
 * should not have to infer what the button does with them.
 *
 * **One-way, and drawn that way.** There is no undo: the server has no DELETE
 * for this signal and the ATS entry is filed the moment it lands. So the answered
 * state is the `Applied` treatment — a disabled marker, not a live control —
 * rather than the reversible "Interested" chip the prototype drew back when a
 * withdraw was assumed. An affordance that cannot keep its promise is worse than
 * its absence.
 *
 * **No date on the answered row.** The prototype reported "Sent 2d ago"; the wire
 * carries only a boolean (`IJobTeam.viewerIsInterestedInTeam`), so the slot that
 * would hold a date stays empty rather than inventing one.
 *
 * **Offered to everyone, honoured with an account.** Like Apply, the button is
 * never hidden or disabled for a visitor — the press lands on the sign-up door.
 * A control invisible to the people most likely to need it cannot be learned.
 */

/** The question, in both states — a row keeps its identity through its states,
 *  the way a posting keeps its title once you have applied to it. */
export const OPEN_ROLE_QUESTION = "Didn't find your role?";

/**
 * What pressing does, and what has happened once it has been pressed.
 *
 * **These may promise outreach**, unlike the per-role interest banner next door,
 * because there is a recipient: the signal is pushed to the team's ATS and also
 * read from a feed the ATS polls, so it reaches the people who hire. Keep the
 * promise conditional ("if a role opens") — the entry is durable, the timing is
 * a human's — and keep it free of any suggestion that it can be taken back,
 * which it cannot.
 */
export const openRoleOffer = (teamName: string) =>
  `Share your profile and ${teamName} will reach out if a matching role opens.`;
export const openRoleSent = (teamName: string) => `${teamName} has your profile and will reach out if a role opens.`;

export const OPEN_ROLE_CTA_LABEL = "I'm interested";
export const OPEN_ROLE_SENT_LABEL = 'Interested';

interface OpenRoleRowProps {
  teamName: string;
  /** The signal is already on record for this viewer. */
  isInterested: boolean;
  /** This team's press is in flight. */
  isPending?: boolean;
  /** Sends the signal — or, logged out, opens the sign-up door. */
  onExpressInterest: () => void;
  /** Draws the rule that separates this from the posting list above it. */
  attached?: boolean;
}

export function OpenRoleRow(props: OpenRoleRowProps) {
  const { teamName, isInterested, isPending = false, onExpressInterest, attached = true } = props;

  return (
    <div className={clsx(s.root, s.row, local.openRow, attached && local.attached)}>
      <div className={s.body}>
        {/* One line, two clauses — not a title with a subtitle under it. Stacked,
            the pair rebuilds the two-line body this block exists to avoid and
            gives a one-sentence invitation the silhouette of a card. Run
            together they read as what they are: a question, and the answer to
            "what happens if I press this".

            The second clause is a <span> inside the same <p> so it inherits the
            type and shares one baseline; a second font-size on one line would
            set two line boxes fighting for the same row. */}
        <p className={local.line}>
          {OPEN_ROLE_QUESTION}{' '}
          <span className={local.sub}>{isInterested ? openRoleSent(teamName) : openRoleOffer(teamName)}</span>
        </p>
      </div>

      <div className={`${s.right} ${s.actions}`}>
        <div className={s.actionButtons}>
          {isInterested ? (
            /* `disabled` is the honest semantics: there is nothing left to
               press and nothing to undo. */
            <button
              type="button"
              disabled
              className={clsx(btn.root, btn.xs, btn.border, btn.neutral, local.button, local.marker)}
            >
              <CheckIcon width={12} height={12} aria-hidden="true" />
              {OPEN_ROLE_SENT_LABEL}
            </button>
          ) : (
            /* Bordered, not filled, and this is the product's own treatment for
               this exact press — the per-role "I'm interested" is bordered too.
               It is also the rank the block asks for: a filled brand button
               would be the loudest thing on the card, above the postings this
               invitation is offered *after*. */
            <Button
              size="xs"
              style="border"
              variant="primary"
              className={local.button}
              disabled={isPending}
              onClick={onExpressInterest}
              aria-label={`Tell ${teamName} you're interested`}
            >
              {OPEN_ROLE_CTA_LABEL}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
