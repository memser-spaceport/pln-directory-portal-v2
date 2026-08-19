'use client';

import { HTMLProps, useState } from 'react';
import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';

import type { IJobRole } from '@/types/jobs.types';
import type { JobSurface } from '@/analytics/jobs.analytics';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { Button } from '@/components/common/Button';
import { CheckIcon } from '@/components/icons';
import { ReferMenu } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu';
import { ArrowIcon, ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { JOB_QUERY_PARAMS } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';

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
  /** Mirrors production's `source`: this row is shared by the board and team-profile prototypes. */
  source?: JobSurface;
  onClick?: () => void;
  /** Referring needs a signed-in referrer; logged out, the button nudges instead. */
  canRefer?: boolean;
  onReferBlocked?: () => void;
  /** Job board: apply happens in-app (sign-in gate → profile → cover letter), so
   *  the parent handles the press. Omitted on the team profile, where Apply is
   *  still a plain link out to the posting. */
  onApply?: (role: IJobRole) => void;
  /** Already applied from this session — the row reports it instead of offering again. */
  applied?: boolean;
}

/**
 * COPY of production `ReferRoleRow` with the "Refer" button added back alongside
 * the share icon. The two are different jobs: the share icon pushes the role out
 * to LinkedIn/X, the Refer button opens the in-network referral modal.
 *
 * **Both actions are gated when logged out, for two different reasons — and the
 * difference between the reasons is the point.**
 *
 *  - **Refer** needs a signed-in referrer because you genuinely cannot vouch for
 *    someone as nobody: the modal signs the note with your name, and a referral
 *    from no one is worth nothing to the team that receives it.
 *  - **Apply** is now gated too, and not as a login toll. One-click applying
 *    means the team receives your *profile* rather than a form you retyped, so
 *    there has to be a profile to send. The exchange is real in both directions:
 *    you give a name, a role and a length of experience; you stop refilling the
 *    same fields once per posting.
 *
 * Nothing on the board is hidden from a logged-out visitor — every role, every
 * team, every link out to the original posting stays open, and the role title
 * still goes straight to the posting in all three Apply states. The gate sits on
 * the act of applying, never on browsing: the moment something is *sent on your
 * behalf* is the only moment identity is actually needed.
 *
 * The Apply slot therefore has three states — `applied`, in-app apply
 * (`onApply`), and the plain link out — and all three wear the same button
 * geometry, so a list of roles doesn't jitter as rows change state.
 *
 * **The board keeps production's arrow**, now beside Apply rather than instead of
 * it. It was the apply link before Apply moved in-app; it stays as the link out
 * to the posting, because that route is not something the new button replaced —
 * it's something the new button displaced. Board only: where Apply is still the
 * link (the team profile), an arrow would be the same door drawn twice.
 */
export function JobReferRoleRow(props: JobReferRoleRowProps) {
  const { role, teamId, teamName, onClick, canRefer = true, onReferBlocked, onApply, applied = false } = props;
  const [referOpen, setReferOpen] = useState(false);

  const { location, seniority, roleTitle, applyUrl, roleCategory } = role;

  const date = getJobDate(role);
  const relative = formatRelativeDays(date);
  const showNew = isNew(date);
  const locationDisplay = isEmpty(location) ? null : location.join(', ');

  const metaParts = [seniority ? seniorityDisplayLabel(seniority) : null, roleCategory, locationDisplay].filter(
    Boolean,
  );

  const linkProps: HTMLProps<HTMLAnchorElement> = applyUrl
    ? { href: `${applyUrl}?${JOB_QUERY_PARAMS}`, target: '_blank', rel: 'noopener noreferrer', onClick }
    : {};

  return (
    <>
      <div className={`${s.root} ${s.row}`}>
        <div className={s.body}>
          <div className={s.titleRow}>
            {/* The title stays a link to the posting on every surface and in
                every Apply state. Applying in-app and reading the posting are
                different acts, and the second one must not disappear because the
                first one became easier. */}
            <a className={`${s.title} ${s.titleLink}`} {...linkProps}>
              {roleTitle}
            </a>
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
                bordered shape Refer used to wear — went with it. */}
            <Button
              size="s"
              style="link"
              variant="secondary"
              className={js.referTone}
              onClick={() => (canRefer ? setReferOpen(true) : onReferBlocked?.())}
            >
              Refer
            </Button>

            <ReferMenu role={role} teamId={teamId} teamName={teamName} source={source} />

            {/* The arrow out to the posting — production's own `.applyArrow`, kept
                on the board.

                It used to BE Apply here: the board's action row ended in a bare
                arrow linking to the external ad. Turning Apply into an in-app
                button took that link with it and left the row with no visible
                way to go read the job description — the title is still a link,
                but a link that looks like a heading is not an affordance. So the
                arrow comes back with the job it actually always did: open the
                posting. Only the label changes, because "Apply to X" is no
                longer what pressing it does.

                Board only. On the team profile there is no `onApply`, so Apply
                *is* the link out, and a second control to the same URL in the
                same row would be the same door twice. It also survives the
                applied state — having applied is no reason to stop being able to
                read the ad. */}
            {onApply && applyUrl && (
              <a
                className={`${s.applyArrow} ${js.arrowTone}`}
                aria-label={`Open the ${roleTitle} posting`}
                {...linkProps}
              >
                <ArrowIcon />
              </a>
            )}

            {applied ? (
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
            ) : onApply ? (
              /* A real <button>, not the anchor: the press no longer leaves the
                 page. It hands off to the parent, which runs the sign-in gate,
                 the profile check and the cover letter in place. */
              <Button size="s" style="fill" variant="primary" className={js.applyButton} onClick={() => onApply(role)}>
                Apply
              </Button>
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
      />
    </>
  );
}
