'use client';

import Image from 'next/image';
import Link from 'next/link';
import isEmpty from 'lodash/isEmpty';

import type { ILatestJobRole } from '@/utils/jobs.utils';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel, teamInitials } from '@/utils/jobs.utils';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { PAGE_ROUTES } from '@/utils/constants';
import { ArrowIcon, ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

import s from './LatestJobs.module.scss';

interface LatestJobsProps {
  roles: ILatestJobRole[];
}

/**
 * Homepage "Latest Job Openings" section — a flat top-N view of the same
 * job-openings data that powers the /jobs board (fetched there via
 * getJobsList in app/actions/jobs.actions.ts), just grouped differently
 * (flat list here vs. per-team groups on the board).
 */
export function LatestJobs({ roles }: LatestJobsProps) {
  const analytics = useJobsAnalytics();

  if (isEmpty(roles)) return null;

  return (
    <section className={s.section}>
      <div className={s.header}>
        <h2 className={s.title}>Latest Job Openings</h2>
        <Link href={PAGE_ROUTES.JOBS} className={s.viewAll}>
          View all jobs
          <ArrowIcon />
        </Link>
      </div>

      <ul className={s.list}>
        {roles.map(({ role, team }, index) => {
          const date = getJobDate(role);
          const relative = formatRelativeDays(date);
          const showNew = isNew(date);
          const locationDisplay = isEmpty(role.location) ? null : role.location.join(', ');
          const metaParts = [
            role.seniority ? seniorityDisplayLabel(role.seniority) : null,
            role.roleCategory,
            locationDisplay,
          ].filter(Boolean);

          const isExternal = Boolean(role.applyUrl);
          const href = role.applyUrl ?? PAGE_ROUTES.JOBS;

          return (
            <li key={role.uid} className={s.card}>
              <a
                className={s.cardLink}
                href={href}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                onClick={() =>
                  analytics.onJobClicked({
                    job_id: role.uid,
                    team_id: team.uid,
                    team_name: team.name,
                    role_title: role.roleTitle,
                    role_category: role.roleCategory,
                    seniority: role.seniority,
                    focus_areas: team.focusAreas,
                    position_in_list: index,
                    filter_state: { source: 'home' },
                  })
                }
              >
                <div className={s.avatar}>
                  {team.logoUrl ? (
                    <Image src={team.logoUrl} alt={team.name} width={40} height={40} className={s.avatarImage} />
                  ) : (
                    <span className={s.avatarInitials}>{teamInitials(team.name)}</span>
                  )}
                </div>

                <div className={s.body}>
                  <div className={s.titleRow}>
                    <span className={s.roleTitle}>{role.roleTitle}</span>
                    {showNew && <span className={s.newBadge}>● New</span>}
                  </div>
                  <div className={s.teamName}>{team.name}</div>
                  {!isEmpty(metaParts) && <div className={s.meta}>{metaParts.join(' · ')}</div>}
                </div>

                <div className={s.right}>
                  {relative && (
                    <span className={s.relative}>
                      <ClockIcon />
                      {relative}
                    </span>
                  )}
                  <ArrowIcon />
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
