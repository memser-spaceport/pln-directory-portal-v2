'use client';

import clsx from 'clsx';

import { formatRelativeDays } from '@/utils/jobs.utils';
import { Button } from '@/components/common/Button';
import { CheckIcon } from '@/components/icons';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

// The posting row's own stylesheet, unchanged — same radius, padding, title,
// meta and action slots, so the two rows line up in one column.
import s from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
// …and its clock tone, so "Sent 2d ago" here is the same grey as "12d ago" two
// lines up. (Its 104px action-slot width is deliberately NOT taken — see
// `.button` in this file's stylesheet.)
import js from './JobReferRoleRow.module.scss';
import local from './OpenRoleRow.module.scss';

import type { OpenInterest } from './openRoles';

interface OpenRoleRowProps {
  /* No `openRole` here any more. The row used to read its `areas` and
     `locations` for a meta line; with that gone it renders nothing from the
     record, and a prop nothing reads is a prop that drifts. Whether a team *has*
     one is still the caller's question — see `JobTeamGroupCard`. */
  teamName: string;
  /**
   * Names the team in the line. Off inside the team's own card, where the name
   * is a few lines up and repeating it would be the only row on the card that
   * does; on when the row is shown away from its card — the board's
   * nothing-matched state, where it is the only thing saying whose door this is.
   */
  showTeam?: boolean;
  /** The signal already sent, if it has been. */
  interest?: OpenInterest;
  /** Opens the interest form — or, logged out, the board's sign-up door. */
  onExpressInterest: () => void;
  /** Adds the pull-up that attaches the row to the role list above it. */
  attached?: boolean;
}

/**
 * A team's open role: **one line and one button**, on the card its postings
 * failed.
 *
 * **The posting row's structure, emptied of everything a posting fills it
 * with.** It takes `ReferRoleRow`'s stylesheet for the parts that still apply —
 * a body on the left, an action slot on the right, the 16px inset that lines the
 * text up with the role titles above — and then drops all five of the things a
 * posting puts around them:
 *
 *  - **No box.** Not the postings' filled slab, and not the dashed well it wore
 *    for one pass either. A container makes this a fifth card in a list of four,
 *    and it is not a card: it is the line under the list, for whoever the list
 *    missed. The team card's own edge is the frame.
 *
 *  - **No meta line.** The first version listed the team's hiring areas and
 *    locations there, because the row has that slot and a posting fills it with
 *    exactly those. A borrowed component's slots are not questions to answer:
 *    the row's whole job is to *ask* one, and facts underneath turn it back into
 *    a small posting — a worse one, with no title and no date.
 *  - **No clock and no `New`.** Those count a posting's age, which is how you
 *    decide whether it is still worth going for. An open role has no age; it is
 *    the state a team is in. The slot is not left empty, though — once a signal
 *    is sent it reports *that* date, exactly as an applied row reports when it
 *    was applied to.
 *  - **No `Refer`.** The referral modal is written around a role: it drafts a
 *    note naming the posting and sends it to the people hiring for it. There is
 *    no posting here to name. Referring someone into a team's open door is a
 *    real thing to want and it is not this pass — see `openRoles.ts`.
 *  - **No link out**, and no link on the line either. There is no ad, and a
 *    question is not a destination: what the line says is answered by the button
 *    beside it, so the line is text and the row has exactly one control.
 *
 * That button is the board's own words for this act — **I'm interested**, the
 * label `InterestStrip` and production's `JobInterestBanner` put on the same
 * signal. One press, one meaning, wherever it appears.
 *
 * **Offered to everyone, honoured with an account.** Like `Refer` and like
 * `Apply`, the button is not hidden or disabled for a visitor — the press lands
 * on the board's sign-up door instead. A control that is invisible to the people
 * most likely to need it cannot be learned.
 */
export function OpenRoleRow(props: OpenRoleRowProps) {
  const { teamName, showTeam = false, interest, onExpressInterest, attached = false } = props;

  /* The line, and it stays a question after the signal is sent — a row keeps its
     identity through its states, the way a posting keeps its title once you have
     applied to it. What changed is reported to the right, in the slot that
     reports state. */
  const line = showTeam ? `Didn't find your role at ${teamName}?` : `Didn't find your role?`;

  const sent = Boolean(interest);

  return (
    <div className={clsx(s.root, s.row, local.openRow, attached && local.attached)}>
      <div className={s.body}>
        <p className={local.line}>{line}</p>
      </div>

      <div className={`${s.right} ${s.actions}`}>
        {/* Same slot the posting age uses, holding the only date this row ever
            has. Before a signal there is nothing here to report — an open role
            that nobody has answered has no chronology, and a "Posted" date would
            be a fact invented to fill a gap. */}
        {interest && (
          <span className={`${s.relative} ${js.relativeTone}`}>
            <ClockIcon />
            {`Sent ${formatRelativeDays(interest.sentAt)}`}
          </span>
        )}

        <div className={s.actionButtons}>
          {sent ? (
            /* The applied row's report — same shell, same 104px width, the check
               and its 6px gap — so a row that has been answered doesn't resize
               the list around it.

               **One thing it does not copy: the disabled paint.** `Applied` is
               half-opacity and dead because an application cannot be unsent, and
               that is exactly what half-opacity should mean. A signal can be
               taken back, so this stays a live control: pressing it reopens the
               record — what you asked for, and the one button that withdraws it.
               Drawn dead, this row would be the only place on the board where a
               reversible thing looks irreversible, and there would be no way
               back to it at all once the confirmation was dismissed.

               **`Interested`, not `Interest sent`.** The slot is 104px wide —
               one number for every state a row's action can take, so the button
               column never steps in or out — and `Interest sent` measures past
               it once the check and its gap are counted. It also mirrors the
               offer the way `Applied` mirrors `Apply`, and the clock beside it
               is already the half that says *sent*. */
            <Button
              size="xs"
              style="border"
              variant="neutral"
              className={local.button}
              onClick={onExpressInterest}
              aria-label={`Your interest in ${teamName} — view it or withdraw it`}
            >
              <CheckIcon width={12} height={12} aria-hidden="true" />
              Interested
            </Button>
          ) : (
            /* Bordered, not filled — and this is the product's own treatment
               for this exact press: `InterestStrip`, the per-role "I'm
               interested" in the apply drawer, is `variant="primary"
               style="border"`. One label, one act, one tone, wherever it
               appears.

               It is also the rank this block asks for now that it is a line
               rather than a card: a filled brand button was the loudest thing
               on a team's card, above four `View job` buttons on the postings
               the invitation is offered *after*. Bordered keeps it a control
               and stops it outranking the roles. */
            <Button
              size="xs"
              style="border"
              variant="primary"
              className={local.button}
              onClick={onExpressInterest}
              aria-label={`Tell ${teamName} you're interested`}
            >
              I&apos;m interested
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
