'use client';

import clsx from 'clsx';

import { formatRelativeDays } from '@/utils/jobs.utils';
import { Button } from '@/components/common/Button';
import { CheckIcon } from '@/components/icons';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

// The posting row's own stylesheet, unchanged — same radius, padding, title,
// meta and action slots, so the two rows line up in one column.
import s from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
// …and its 104px action-slot width, so the button column doesn't step in or out
// when the last row of the card is this one. That number is chosen once, in the
// posting row, for exactly this reason.
import js from './JobReferRoleRow.module.scss';
import local from './OpenRoleRow.module.scss';

import type { OpenRole, OpenInterest } from './openRoles';

interface OpenRoleRowProps {
  openRole: OpenRole;
  teamName: string;
  /**
   * Names the team in the title. Off inside the team's own card, where the name
   * is one line up and repeating it would be the only title on the card that
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
 * A team's open role, as a row on its card.
 *
 * **The posting row's shape, re-ranked for a different reader.** It takes
 * `ReferRoleRow`'s stylesheet verbatim, so the title, the meta line and the
 * action slot measure the same — and then drops the three things a posting has
 * and this does not:
 *
 *  - **No clock and no `New`.** Those count a posting's age, which is how you
 *    decide whether it is still worth going for. An open role has no age; it is
 *    the state a team is in. The slot is not left empty, though — once a signal
 *    is sent it reports *that* date, exactly as an applied row reports when it
 *    was applied to.
 *  - **No `Refer`.** The referral modal is written around a role: it drafts a
 *    note naming the posting and sends it to the people hiring for it. There is
 *    no posting here to name. Referring someone into a team's open door is a
 *    real thing to want and it is not this pass — see the note in `openRoles.ts`.
 *  - **No link out.** There is no ad.
 *
 * What it keeps is the row's one action position, and the button in it is the
 * board's own words for this act: **I'm interested**, the same label
 * `InterestStrip` and production's `JobInterestBanner` put on the same signal.
 * One press, one meaning, wherever it appears.
 *
 * **Offered to everyone, honoured with an account.** Like `Refer` and like
 * `Apply`, the button is not hidden or disabled for a visitor — the press lands
 * on the board's sign-up door instead. A control that is invisible to the people
 * most likely to need it cannot be learned.
 */
export function OpenRoleRow(props: OpenRoleRowProps) {
  const { openRole, teamName, showTeam = false, interest, onExpressInterest, attached = false } = props;

  const title = showTeam ? `Open role at ${teamName}` : 'Open role';

  /* The fields, in the posting row's own meta order: what the role would be,
     then where it is. "Engineering, Research or Product" rather than a
     comma-run — this is a list of alternatives you pick one of, and the meta
     line is the only place that is said before the form opens. */
  const areaList =
    openRole.areas.length > 1
      ? `${openRole.areas.slice(0, -1).join(', ')} or ${openRole.areas[openRole.areas.length - 1]}`
      : openRole.areas[0];
  const metaParts = [areaList, openRole.locations.join(', ')].filter(Boolean);

  const sent = Boolean(interest);

  return (
    <div className={clsx(s.root, s.row, local.openRow, attached && local.attached)}>
      <div className={s.body}>
        <div className={s.titleRow}>
          <button
            type="button"
            className={`${s.title} ${s.titleLink} ${local.titleButton}`}
            onClick={onExpressInterest}
          >
            {title}
          </button>
        </div>
        <div className={s.meta}>{metaParts.join(' · ')}</div>
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
              size="s"
              style="border"
              variant="neutral"
              className={clsx(js.applyButton, js.appliedButton)}
              onClick={onExpressInterest}
              aria-label={`Your interest in ${teamName} — view it or withdraw it`}
            >
              <CheckIcon width={12} height={12} aria-hidden="true" />
              Interested
            </Button>
          ) : (
            <Button
              size="s"
              style="fill"
              variant="primary"
              className={js.applyButton}
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
