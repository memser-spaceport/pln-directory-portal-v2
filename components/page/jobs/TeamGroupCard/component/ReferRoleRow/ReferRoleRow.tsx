'use client';

import { HTMLProps } from 'react';
import isEmpty from 'lodash/isEmpty';

import type { IJobRole } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { ReferMenu } from './components/ReferMenu';
import { ArrowIcon, ClockIcon } from './components/Icons';

import s from './ReferRoleRow.module.scss';
import { JOB_QUERY_PARAMS } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';

interface ReferRoleRowProps {
  role: IJobRole;
  teamName: string;
  onClick?: () => void;
}

/**
 * COPY-SIMPLIFY of production `RoleRow` with a per-job "Refer" control added.
 * The whole row is no longer a single <a> (can't nest a button in an anchor):
 * the title + arrow are the apply link, and the ReferMenu sits alongside the meta.
 */
export function ReferRoleRow(props: ReferRoleRowProps) {
  const { role, teamName, onClick } = props;

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
          <ReferMenu role={role} teamName={teamName} />

          <a className={s.applyArrow} aria-label={`Apply to ${roleTitle}`} {...linkProps}>
            <ArrowIcon />
          </a>
        </div>
      </div>
    </div>
  );
}
