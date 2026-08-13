'use client';

import { HTMLProps } from 'react';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';

import { Button } from '@/components/common/Button';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';

import type { IJobRole } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { JOB_QUERY_PARAMS } from './constants';

import { ReferMenu } from './components/ReferMenu';
import { ArrowIcon, ClockIcon } from './components/Icons';
import { ReferModal } from '@/prototypes/entries/job-board/components/ReferModal/ReferModal';

import s from './ReferRoleRow.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { useRouter } from 'next/navigation';

interface ReferRoleRowProps {
  role: IJobRole;
  teamId: string;
  teamName: string;
  currentUser: IUserInfo | null;
  onClick?: () => void;
}

/**
 * COPY-SIMPLIFY of production `RoleRow` with a per-job "Refer" control added.
 * The whole row is no longer a single <a> (can't nest a button in an anchor):
 * the title + arrow are the apply link, and the ReferMenu sits alongside the meta.
 */
export function ReferRoleRow(props: ReferRoleRowProps) {
  const { role, teamId, teamName, currentUser, onClick } = props;

  const router = useRouter();
  const analytics = useJobsAnalytics();
  const [referOpen, toggleReferOpen] = useToggle(false);

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

  const referBase = {
    job_id: role.uid,
    team_id: teamId,
    team_name: teamName,
    role_title: roleTitle,
    role_category: roleCategory,
    seniority,
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
          <span className={s.relative}>
            <ClockIcon />
            {relative}
          </span>
        )}

        <div className={s.actionButtons}>
          <Button size="s" style="border" variant="neutral" className={s.referButton} onClick={onRefer}>
            Refer
          </Button>

          <ReferMenu role={role} teamId={teamId} teamName={teamName} />

          <a className={s.applyArrow} aria-label={`Apply to ${roleTitle}`} {...linkProps}>
            <ArrowIcon />
          </a>
        </div>
      </div>

      <ReferModal open={referOpen} onClose={toggleReferOpen} role={role} teamId={teamId} teamName={teamName} />
    </div>
  );
}
