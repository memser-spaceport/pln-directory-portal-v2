'use client';

import { HTMLProps } from 'react';
import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';

import { Button } from '@/components/common/Button';
import { CheckIcon } from '@/components/icons';
import { useJobsAnalytics, type JobSurface } from '@/analytics/jobs.analytics';
import { useRoleApplication } from '@/services/jobs/hooks/useJobApplications';

import type { IJobRole, IJobTeam } from '@/types/jobs.types';
import type { JobDetailTarget } from '@/components/page/jobs/hooks/useJobApplyFlow';
import { canSeeOriginalPosting } from '@/services/jobs/job-board-viewer';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { jobApplyQueryParams } from './constants';

import { ReferMenu } from './components/ReferMenu';
import { ArrowIcon, ClockIcon } from './components/Icons';
import { ReferModal } from '@/prototypes/entries/job-board/components/ReferModal/ReferModal';

import s from './ReferRoleRow.module.scss';
// Button's own stylesheet, so the "Applied" state is the real DS button shape.
import btn from '@/components/common/Button/Button.module.scss';
import ap from './ReferRoleRowApply.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { useLoginRedirect } from '@/components/core/login/utils';

/**
 * In-app Apply, switched on by prop PRESENCE — the row imports no feature flag.
 * The host (`JobsContent`) passes this only when `SHOW_JOB_BOARD_APPLY` is on
 * and the viewer may apply, which makes flag-off byte-identity structural
 * rather than test-enforced.
 */
export interface RowApplyProps {
  onApply: (target: JobDetailTarget) => void;
  /** Scopes the applied-map subscription; undefined while logged out. */
  memberUid: string | undefined;
  /**
   * Read the job in the app first.
   *
   * Presence swaps the row's one button from **Apply** to **View job** and
   * moves Apply to the bottom of the description it applies to — a row carries
   * a title, a seniority and a location, which is not enough to decide with, so
   * pressing Apply from it was pressing send on a job you had not read.
   *
   * Optional for the same reason `apply` is: the host decides. The board passes
   * it with every apply slot now that reading is step 1 of the flow; the team
   * profile does not, and keeps its direct Apply.
   */
  onViewJob?: (target: { role: IJobRole; teamId: string; teamName: string; team: IJobTeam }) => void;
}

interface ReferRoleRowProps {
  role: IJobRole;
  teamId: string;
  teamName: string;
  currentUser: IUserInfo | null;
  /** Which surface this row is rendered on — drives analytics and the outbound utm_medium. */
  source: JobSurface;
  /**
   * The full team record, for surfaces that can open the in-app description —
   * its masthead needs the logo and focus areas that `teamId`/`teamName` cannot
   * carry. Only the board passes it; the team profile has no detail drawer.
   *
   * View job is offered only when this AND `apply.onViewJob` are present, so a
   * drawer can never be opened without the masthead it renders.
   */
  team?: IJobTeam;
  onClick?: () => void;
  apply?: RowApplyProps;
}

/**
 * COPY-SIMPLIFY of production `RoleRow` with a per-job "Refer" control added.
 * The whole row is no longer a single <a> (can't nest a button in an anchor):
 * the title + arrow are the apply link, and the ReferMenu sits alongside the meta.
 *
 * With `apply` present (the in-app apply flow), the trailing slot becomes a real
 * Apply button — rendered regardless of `applyUrl`, which makes link-less roles
 * appliable for the first time — and Refer drops to the quiet text button (Apply
 * is what the row is for; Refer is the sideline). When the row opens the job
 * drawer, the external arrow is gone: the drawer is the way to read the posting.
 * A row already applied to reports "Applied" in the same geometry instead of
 * offering again.
 */
export function ReferRoleRow(props: ReferRoleRowProps) {
  const { role, teamId, teamName, currentUser, source, onClick, apply, team } = props;

  const goToLogin = useLoginRedirect();

  /* The way out to the company's own posting — withheld from the two people who
     came here to apply through this board. See `canSeeOriginalPosting`. */
  const showPosting = canSeeOriginalPosting({ isLoggedIn: Boolean(currentUser), userInfo: currentUser });
  const analytics = useJobsAnalytics();
  const [referOpen, toggleReferOpen] = useToggle(false);

  /* Both, or neither — the same rule `viewJob` follows, and for the same
     reason: the flow opens on the reading step, which needs the team record to
     draw its masthead. A row without one cannot start a flow. */
  const inAppApply = Boolean(apply && team);
  // Per-row subscription to the shared applied map: one application re-renders
  // exactly this row, never the list. Inert (enabled: false) without apply props.
  const application = useRoleApplication(role.uid, { memberUid: apply?.memberUid, enabled: Boolean(apply?.memberUid) });
  const applied = Boolean(application);
  const onViewJob = apply?.onViewJob;
  /* Both, or neither — see the `team` prop. */
  const viewJob = onViewJob && team ? () => onViewJob({ role, teamId, teamName, team }) : null;

  const { location, seniority, roleTitle, applyUrl, roleCategory } = role;

  const date = getJobDate(role);
  const relative = formatRelativeDays(date);
  const showNew = isNew(date);
  const locationDisplay = isEmpty(location) ? null : location.join(', ');

  const metaParts = [seniority ? seniorityDisplayLabel(seniority) : null, roleCategory, locationDisplay].filter(
    Boolean,
  );

  // Not every posting has a destination. Without one there is nothing to open, so the
  // row drops the title link and the arrow rather than rendering an <a> with no href:
  // `.titleLink` and `.applyArrow` both carry hover states and a pointer cursor, which
  // would offer a click that silently does nothing. (In-app Apply is unaffected — it
  // never leaves the page, so it renders with or without a URL.)
  const hasApplyUrl = Boolean(applyUrl);

  const linkProps: HTMLProps<HTMLAnchorElement> = hasApplyUrl
    ? { href: `${applyUrl}?${jobApplyQueryParams(source)}`, target: '_blank', rel: 'noopener noreferrer', onClick }
    : {};

  const referBase = {
    job_id: role.uid,
    team_id: teamId,
    team_name: teamName,
    role_title: roleTitle,
    role_category: roleCategory,
    seniority,
    source,
    uses_team_refer_email: Boolean(team?.jobReferEmail?.trim()),
  };

  function onRefer() {
    const authRequired = !currentUser;
    analytics.onJobReferClicked({ ...referBase, auth_required: authRequired });

    if (currentUser) {
      toggleReferOpen();
    } else {
      goToLogin();
    }
  }

  return (
    <div className={`${s.root} ${s.row}`}>
      <div className={s.body}>
        <div className={s.titleRow}>
          {/* The title opens whatever this surface's canonical reading of the
              job is. With the in-app description on, that is the drawer — so the
              title and the View job button are one door with two handles. The
              alternative was a title going somewhere other than the button
              beside it. Everywhere without an in-app description the title is
              still the link out, unchanged. */}
          {viewJob ? (
            <button type="button" className={`${s.title} ${s.titleLink} ${ap.titleButton}`} onClick={viewJob}>
              {roleTitle}
            </button>
          ) : hasApplyUrl ? (
            <a className={`${s.title} ${s.titleLink}`} {...linkProps}>
              {roleTitle}
            </a>
          ) : (
            <span className={s.title}>{roleTitle}</span>
          )}
          {/* Mobile-only: "New" aligned to the top-right, in line with the role name. */}
          {showNew && <span className={`${s.newBadge} ${s.newBadgeMobile}`}>● New</span>}
        </div>
        {!isEmpty(metaParts) && <div className={s.meta}>{metaParts.join(' · ')}</div>}
      </div>

      <div className={`${s.right} ${s.actions}`}>
        {showNew && <span className={`${s.newBadge} ${s.newBadgeDesktop}`}>● New</span>}
        {/* Once applied, the clock reports the application rather than the
            posting's age — which is what makes a second "Applied" chip in the
            action slot unnecessary below. */}
        {(relative || application) && (
          <span className={clsx(s.relative, inAppApply && ap.relativeTone)}>
            <ClockIcon />
            {application ? `Applied ${formatRelativeDays(application.appliedAt)}` : relative}
          </span>
        )}

        <div className={s.actionButtons}>
          {inAppApply ? (
            /* Quiet text button: with a filled Apply in the row, the two are not
               peers — Apply is what the row is for, Refer is the sideline. */
            <Button size="s" style="link" variant="secondary" className={ap.referTone} onClick={onRefer}>
              Refer
            </Button>
          ) : (
            <Button size="s" style="border" variant="neutral" className={s.referButton} onClick={onRefer}>
              Refer
            </Button>
          )}

          <ReferMenu role={role} teamId={teamId} teamName={teamName} source={source} />

          {showPosting &&
            hasApplyUrl &&
            !viewJob &&
            (inAppApply ? (
              <a
                className={`${s.applyArrow} ${ap.arrowTone}`}
                aria-label={`Open the ${roleTitle} posting`}
                {...linkProps}
              >
                <ArrowIcon />
              </a>
            ) : (
              <a className={s.applyArrow} aria-label={`Apply to ${roleTitle}`} {...linkProps}>
                <ArrowIcon />
              </a>
            ))}

          {/* The board's one action, once the description moved in-app. Apply is
              no longer here: the row's job is now the reading step, and Apply
              sits at the bottom of what it applies to.

              One button in both states, because the applied fact is already in
              this row — the clock to the left reads "Applied 3d ago" instead of
              the posting's age. A second report of the same fact, in the slot
              that used to hold the offer, would only be filling the space the
              offer left. And having applied is no reason to stop being able to
              reread the job. The drawer's own footer carries the Applied
              control, where the offer it replaces is. */}
          {viewJob ? (
            <Button size="s" style="fill" variant="primary" className={ap.applyButton} onClick={viewJob}>
              View job
            </Button>
          ) : (
            inAppApply &&
            (applied ? (
              /* Same slot, same geometry: a row you've applied to must not
                 resize the list around it. `disabled` is the honest semantics —
                 there is nothing left to press. */
              <button
                type="button"
                disabled
                className={clsx(btn.root, btn.small, btn.border, btn.neutral, ap.applyButton, ap.appliedButton)}
              >
                <CheckIcon width={12} height={12} aria-hidden="true" />
                Applied
              </button>
            ) : (
              /* A real <button>, not the anchor: the press no longer leaves the
                 page. It hands off to the flow, which runs the sign-in gate, the
                 profile check and the cover letter in place. */
              <Button
                size="s"
                style="fill"
                variant="primary"
                className={ap.applyButton}
                onClick={() => apply!.onApply({ role, teamId, teamName, team: team! })}
              >
                Apply
              </Button>
            ))
          )}
        </div>
      </div>

      <ReferModal
        open={referOpen}
        onClose={toggleReferOpen}
        role={role}
        teamId={teamId}
        teamName={teamName}
        source={source}
        jobReferEmail={team?.jobReferEmail}
      />
    </div>
  );
}
