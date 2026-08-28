'use client';

import { HTMLProps } from 'react';
import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';

import { Button } from '@/components/common/Button';
import { CheckIcon } from '@/components/icons';
import { useJobsAnalytics, type JobSurface } from '@/analytics/jobs.analytics';
import { useIsRoleApplied } from '@/services/jobs/hooks/useJobApplications';

import type { IJobRole } from '@/types/jobs.types';
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
import { useRouter } from 'next/navigation';

/**
 * In-app Apply, switched on by prop PRESENCE — the row imports no feature flag.
 * The host (`JobsContent`) passes this only when `SHOW_JOB_BOARD_APPLY` is on
 * and the viewer may apply, which makes flag-off byte-identity structural
 * rather than test-enforced.
 */
export interface RowApplyProps {
  onApply: (target: { role: IJobRole; teamId: string; teamName: string }) => void;
  /** Scopes the applied-map subscription; undefined while logged out. */
  memberUid: string | undefined;
}

interface ReferRoleRowProps {
  role: IJobRole;
  teamId: string;
  teamName: string;
  currentUser: IUserInfo | null;
  /** Which surface this row is rendered on — drives analytics and the outbound utm_medium. */
  source: JobSurface;
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
 * appliable for the first time — the external arrow stays as the link out to the
 * posting, and Refer drops to the quiet text button (Apply is what the row is
 * for; Refer is the sideline). A row already applied to reports "Applied" in the
 * same geometry instead of offering again.
 */
export function ReferRoleRow(props: ReferRoleRowProps) {
  const { role, teamId, teamName, currentUser, source, onClick, apply } = props;

  const router = useRouter();
  const analytics = useJobsAnalytics();
  const [referOpen, toggleReferOpen] = useToggle(false);

  const inAppApply = Boolean(apply);
  // Per-row subscription to the shared applied map: one application re-renders
  // exactly this row, never the list. Inert (enabled: false) without apply props.
  const applied = useIsRoleApplied(role.uid, { memberUid: apply?.memberUid, enabled: Boolean(apply?.memberUid) });

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
  };

  function onRefer() {
    const authRequired = !currentUser;
    analytics.onJobReferClicked({ ...referBase, auth_required: authRequired });

    if (currentUser) {
      toggleReferOpen();
    } else {
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  }

  return (
    <div className={`${s.root} ${s.row}`}>
      <div className={s.body}>
        <div className={s.titleRow}>
          {hasApplyUrl ? (
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
        {relative && (
          <span className={clsx(s.relative, inAppApply && ap.relativeTone)}>
            <ClockIcon />
            {relative}
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

          {hasApplyUrl &&
            (inAppApply ? (
              /* The arrow's job changes when Apply moves in-app: it stays as the
                 link out to the posting — reading the ad and applying are
                 different acts — and survives the applied state. */
              <a className={`${s.applyArrow} ${ap.arrowTone}`} aria-label={`Open the ${roleTitle} posting`} {...linkProps}>
                <ArrowIcon />
              </a>
            ) : (
              <a className={s.applyArrow} aria-label={`Apply to ${roleTitle}`} {...linkProps}>
                <ArrowIcon />
              </a>
            ))}

          {inAppApply &&
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
                onClick={() => apply!.onApply({ role, teamId, teamName })}
              >
                Apply
              </Button>
            ))}
        </div>
      </div>

      <ReferModal
        open={referOpen}
        onClose={toggleReferOpen}
        role={role}
        teamId={teamId}
        teamName={teamName}
        source={source}
      />
    </div>
  );
}
