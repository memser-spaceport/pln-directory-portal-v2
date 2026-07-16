'use client';

import { HTMLProps } from 'react';
import isEmpty from 'lodash/isEmpty';

import type { IJobRole } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { ArrowIcon, ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/RoleRow/components/Icons';

// Reuse the production RoleRow styling 1:1; local extras only for the apply link + refer slot.
import rr from '@/components/page/jobs/TeamGroupCard/component/RoleRow/RoleRow.module.scss';
import s from './ReferRoleRow.module.scss';

import { ReferMenu } from './ReferMenu';

interface ReferRoleRowProps {
  role: IJobRole;
  teamName: string;
}

/**
 * COPY-SIMPLIFY of production `RoleRow` with a per-job "Refer" control added.
 * The whole row is no longer a single <a> (can't nest a button in an anchor):
 * the title + arrow are the apply link, and the ReferMenu sits alongside the meta.
 */
export function ReferRoleRow({ role, teamName }: ReferRoleRowProps) {
  const { location, seniority, roleTitle, applyUrl, roleCategory } = role;

  const date = getJobDate(role);
  const relative = formatRelativeDays(date);
  const showNew = isNew(date);
  const locationDisplay = isEmpty(location) ? null : location.join(', ');

  const metaParts = [seniority ? seniorityDisplayLabel(seniority) : null, roleCategory, locationDisplay].filter(Boolean);

  const linkProps: HTMLProps<HTMLAnchorElement> = applyUrl
    ? { href: applyUrl, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <div className={rr.root}>
      <div className={rr.body}>
        <a className={`${rr.title} ${s.titleLink}`} {...linkProps}>
          {roleTitle}
        </a>
        {!isEmpty(metaParts) && <div className={rr.meta}>{metaParts.join(' · ')}</div>}
      </div>

      <div className={rr.right}>
        {showNew && <span className={rr.newBadge}>● New</span>}
        {relative && (
          <span className={rr.relative}>
            <ClockIcon />
            {relative}
          </span>
        )}

        <ReferMenu role={role} teamName={teamName} />

        <a className={s.applyArrow} aria-label={`Apply to ${roleTitle}`} {...linkProps}>
          <ArrowIcon />
        </a>
      </div>
    </div>
  );
}
