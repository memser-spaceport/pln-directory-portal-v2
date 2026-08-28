'use client';

import { HTMLProps, useState } from 'react';
import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';

import type { IJobRole, IJobTeam } from '@/types/jobs.types';
import type { JobSurface } from '@/analytics/jobs.analytics';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { Button } from '@/components/common/Button';
import { CheckIcon } from '@/components/icons';
import { ReferMenu } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { jobApplyQueryParams } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';

// Reuse the production ReferRoleRow styling 1:1, with local extras for the button.
import s from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
// Button's own stylesheet, so the Apply anchor is the real DS button and not a
// hand-rolled lookalike.
import btn from '@/components/common/Button/Button.module.scss';
import js from './JobReferRoleRow.module.scss';

import { ReferModal } from './components/ReferModal';

interface JobReferRoleRowProps {
  role: IJobRole;
  teamId: string;
  teamName: string;
  team?: IJobTeam;
  /** Mirrors production's `source`: this row is shared by the board and team-profile prototypes. */
  source?: JobSurface;
  onClick?: () => void;
  /** Whether pressing Refer may actually open the referral modal. The button is
   *  rendered either way — see `onReferSignUp` for what the other case does. */
  canRefer?: boolean;
  /** Where the press goes when `canRefer` is false: the board's sign-up door.
   *  Required in practice on the board; the team profile passes `canRefer` and
   *  has no modal to fall back to. */
  onReferSignUp?: () => void;
  /* (`onApply` — an in-app Apply button in this row — is gone. It was the board's
      slot back when pressing Apply from a row was possible; the row's button
      became **View job** when the description moved in-app, which left the
      branch reachable from no caller at all. The team profile never had it: its
      Apply is the plain link out below.) */
  /** Job board: opens the role in the apply flow, on its reading step. When it is
   *  present the row's button becomes **View job** and Apply sits in that flow's
   *  footer — see the note above the actions. Omitted on the team profile, which
   *  has no in-app description to open. */
  onViewJob?: (role: IJobRole) => void;
  /** Already applied from this session — the row reports it instead of offering again. */
  applied?: boolean;
  /** ISO stamp of when the application went. Present only when `applied`; the
   *  clock slot reports this instead of the posting age — see the note there. */
  appliedAt?: string;
}

/**
 * COPY of production `ReferRoleRow` with the "Refer" button added back alongside
 * the share icon. The two are different jobs: the share icon pushes the role out
 * to LinkedIn/X, the Refer button opens the in-network referral modal.
 *
 * **Both actions are gated when logged out, and both are gated the same way: the
 * control is on screen for everyone, and the press asks for an account.**
 *
 *  - **Refer** needs a signed-in referrer because you genuinely cannot vouch for
 *    someone as nobody: the modal signs the note with your name, and a referral
 *    from no one is worth nothing to the team that receives it. So the *modal*
 *    stays shut to a stranger — but the *button* does not.
 *
 *    It used to be hidden outright, on the reasoning that nobody arrives at a
 *    job board wanting to refer, so offering it to a stranger only to bounce
 *    them into sign-in advertises a job they didn't come to do. That reversed.
 *    Hiding it means a logged-out visitor cannot learn that referring is a thing
 *    this board does at all — and the person best placed to refer is very often
 *    exactly the visitor with no account yet, who opened this role, decided it
 *    wasn't for them, and knows who it is for. Removing the control removes the
 *    thought. So the button is there for everyone, and pressing it while logged
 *    out opens the board's sign-up door (`onReferSignUp`) rather than the
 *    referral modal — which is what production's own `ReferRoleRow` does with an
 *    anonymous visitor, one step earlier. The sign-up modal carries "Already
 *    have an account? Sign in", so a single press offers both doors.
 *  - **Apply** is gated too, and not as a login toll. One-click applying
 *    means the team receives your *profile* rather than a form you retyped, so
 *    there has to be a profile to send. The exchange is real in both directions:
 *    you give a name, a role and a length of experience; you stop refilling the
 *    same fields once per posting.
 *
 * Neither gate is a dead control: both press through to the same ask, so the row
 * looks identical to everyone and the only thing the account changes is where
 * the press lands.
 *
 * Nothing on the board is hidden from a logged-out visitor — every role, every
 * team, every link out to the original posting stays open, and the role title
 * still goes straight to the posting in all three Apply states. The gate sits on
 * the act of applying, never on browsing: the moment something is *sent on your
 * behalf* is the only moment identity is actually needed.
 *
 * The row's action slot therefore has three states — **View job** where an
 * in-app description exists, `applied`, and the plain link out where it doesn't
 * — and all three wear the same button geometry, so a list of roles doesn't
 * jitter as rows change state.
 *
 * **The board no longer carries production's `↗`.** It was the apply link before
 * Apply moved in-app, then stood for a while beside Apply as the link out to the
 * posting. The route is what mattered and the route survives one level in — the
 * drawer's step 1 opens with a labelled `Original posting` link. See the note
 * where the arrow was rendered. On the team profile, where there is no in-app
 * description, Apply *is* still the link out and nothing changed.
 */
export function JobReferRoleRow(props: JobReferRoleRowProps) {
  const {
    role,
    teamId,
    teamName,
    team,
    source = 'job-board',
    onClick,
    canRefer = true,
    onReferSignUp,
    onViewJob,
    applied = false,
    appliedAt,
  } = props;
  const [referOpen, setReferOpen] = useState(false);

  const { location, seniority, roleTitle, applyUrl, roleCategory } = role;

  const date = getJobDate(role);
  /* Once you have applied, the clock changes what it counts.
   *
   * The slot holds the posting's age, which is what you need in order to decide
   * whether to go for it. On a row you have already gone for, that number is
   * both useless and actively misleading — in the Applied tab especially, "9d
   * ago" beside a role you applied to reads as when you applied. So the applied
   * row reports its own date instead, labelled, and the posting age steps aside
   * rather than sitting next to a second number nobody asked to compare. */
  const relative = appliedAt ? `Applied ${formatRelativeDays(appliedAt)}` : formatRelativeDays(date);
  /* No "New" on a row you have applied to. The badge is an invitation to look at
     something before it goes stale, and that has already happened. */
  const showNew = isNew(date) && !applied;
  const locationDisplay = isEmpty(location) ? null : location.join(', ');

  const metaParts = [seniority ? seniorityDisplayLabel(seniority) : null, roleCategory, locationDisplay].filter(
    Boolean,
  );

  const linkProps: HTMLProps<HTMLAnchorElement> = applyUrl
    ? { href: `${applyUrl}?${jobApplyQueryParams(source)}`, target: '_blank', rel: 'noopener noreferrer', onClick }
    : {};

  return (
    <>
      <div className={`${s.root} ${s.row}`}>
        <div className={s.body}>
          <div className={s.titleRow}>
            {/* The title opens whatever the surface's canonical reading of the
                job is. On the board that is now the in-app description, so the
                title and the **View job** button are one door with two handles —
                the alternative was a title that went somewhere else than the
                button beside it. Everywhere without an in-app description (the
                team profile) the title is still the link out, unchanged. */}
            {onViewJob ? (
              <button
                type="button"
                className={`${s.title} ${s.titleLink} ${js.titleButton}`}
                onClick={() => onViewJob(role)}
              >
                {roleTitle}
              </button>
            ) : (
              <a className={`${s.title} ${s.titleLink}`} {...linkProps}>
                {roleTitle}
              </a>
            )}
            {/* Mobile-only: "New" aligned to the top-right, in line with the role name. */}
            {showNew && <span className={`${s.newBadge} ${s.newBadgeMobile}`}>● New</span>}
          </div>
          {!isEmpty(metaParts) && <div className={s.meta}>{metaParts.join(' · ')}</div>}
        </div>

        <div className={`${s.right} ${s.actions}`}>
          {showNew && <span className={`${s.newBadge} ${s.newBadgeDesktop}`}>● New</span>}
          {relative && (
            <span className={`${s.relative} ${js.relativeTone}`}>
              <ClockIcon />
              {relative}
            </span>
          )}

          <div className={s.actionButtons}>
            {/* Refer is the quiet text button on every surface. The two actions
                aren't peers: Apply is what the row is for, Refer is the sideline
                you take when the role is right for someone who isn't you.
                `.link` carries no `neutral`, so `secondary` is the design
                system's quiet text button. It also zeroes padding and min-width,
                which is why `.referButton` — pure horizontal padding for the
                bordered shape Refer used to wear — went with it.

                Present for everyone, signed in or not. The account changes only
                where the press lands: the referral modal if there is a name to
                sign the note with, the board's sign-up door if there isn't. Not
                disabled and not hidden in the second case — a stranger has to be
                able to find out that referring is something this board does, and
                a press that opens the one control standing between them and
                doing it is a working button, not a refused one. See the note
                above the component for why this reversed. */}
            <Button
              size="s"
              style="link"
              variant="secondary"
              className={js.referTone}
              onClick={() => (canRefer ? setReferOpen(true) : onReferSignUp?.())}
            >
              Refer
            </Button>

            <ReferMenu role={role} teamId={teamId} teamName={teamName} source={source} />

            {/* (The `↗` out to the external posting stood here, on the board
                only. It was removed, and the route it carried was not: the
                drawer's step 1 opens with **Original posting** in its masthead
                (`JobDetailPane`'s `.postingLink`), a labelled link to the same
                URL — so the ad is still one press from the row, via the control
                that already opens the job.

                Narrowed since: that link is **members only** now, so for a
                logged-out visitor the row genuinely is the end of the road to
                the external ad. Deliberate — see the note on `postingHref` — and
                it does not argue for putting the arrow back, because restoring
                it here would reopen on the board exactly the door the drawer
                just closed.

                Worth recording that this glyph was restored once before, after
                being deleted along with the old arrow-as-Apply. That restore was
                right at the time: the row had no other way to reach the ad. It
                does now, and the version that survived is the better one — a
                bare arrow at the end of an action row is a destination nobody
                can name until they press it, where "Original posting" says which
                of the two readings of this job it is. It also takes a fourth
                grey out of a 200px cluster that had no business holding four. */}
            {onViewJob ? (
              /* The board's button, once the description moved in-app.

                 Apply is no longer here. A row carries a title, a seniority and
                 a location, which is not enough to decide with — pressing Apply
                 from it was pressing send on a job you had not read. So the
                 row's one action is now the reading step, and Apply sits at the
                 bottom of what it applies to. It costs one press, and the press
                 it costs is the one where the person learns what they are
                 applying for.

                 One button in both states, because the applied fact is already
                 in this row: the clock to the left reads "Applied 3d ago"
                 instead of the posting's age. A second report of the same fact,
                 in the slot that used to hold the offer, would only be there to
                 fill the space the offer left — and having applied is no reason
                 to stop being able to reread the job. The drawer's own footer
                 carries the Applied control, where the offer it replaces is. */
              <Button
                size="s"
                style="fill"
                variant="primary"
                className={js.applyButton}
                onClick={() => onViewJob(role)}
              >
                View job
              </Button>
            ) : applied ? (
              /* Same slot, same geometry: a row you've applied to must not
                 resize the list around it. Bordered neutral rather than filled
                 primary, because it has stopped being an offer and become a
                 statement of fact — it vacates the row's one call-to-action
                 position without leaving a hole where the button was.
                 `disabled` is the honest semantics (there is nothing left to
                 press); `.appliedButton` takes the design system's disabled
                 *paint* back off, since half-opacity reads as "not available to
                 you yet" rather than "done". */
              <button
                type="button"
                disabled
                className={clsx(btn.root, btn.small, btn.border, btn.neutral, js.applyButton, js.appliedButton)}
              >
                <CheckIcon width={12} height={12} aria-hidden="true" />
                Applied
              </button>
            ) : (
              /* An anchor wearing Button's classes rather than a <Button>: this
                 opens an external posting, so it has to stay a real link (new
                 tab, middle-click, copy address). `Button` renders a <button>
                 and nesting one inside an <a> is invalid. */
              <a
                className={clsx(btn.root, btn.small, btn.fill, btn.primary, js.applyButton)}
                aria-label={`Apply to ${roleTitle}`}
                {...linkProps}
              >
                Apply
              </a>
            )}
          </div>
        </div>
      </div>

      <ReferModal
        open={referOpen}
        onClose={() => setReferOpen(false)}
        role={role}
        teamId={teamId}
        teamName={teamName}
        source={source}
        jobReferEmail={team?.jobReferEmail}
      />
    </>
  );
}
