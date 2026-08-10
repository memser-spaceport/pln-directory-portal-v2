'use client';

import { HTMLProps } from 'react';
import isEmpty from 'lodash/isEmpty';

import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel, teamInitials } from '@/utils/jobs.utils';
import { JOB_QUERY_PARAMS } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
import { ArrowIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

import { useLatestJobOpenings, type ILatestJobOpening } from './hooks/useLatestJobOpenings';

import s from './LatestJobsSection.module.scss';

/**
 * "Latest job openings" teaser for the home page — a flat, cross-team list of
 * the most recently posted individual roles (unlike the job board itself,
 * which groups roles by team). Reads from the same backend endpoint as
 * /jobs via `fetchJobsList`; clicking a role hands off to its apply link
 * (or the board) rather than reproducing the board's filters/search here.
 *
 * Non-blocking, like the feed's hiring cards on this same page: while
 * loading, on error, or with nothing to show, the section simply doesn't
 * render rather than occupying space with a skeleton or an error state.
 */
export function LatestJobsSection() {
  const { openings, isLoading, isError } = useLatestJobOpenings();

  if (isLoading || isError || isEmpty(openings)) {
    return null;
  }

  return (
    <section className={s.section}>
      <div className={s.header}>
        <h2 className={s.title}>Latest Job Openings</h2>
        <a href="/jobs" className={s.viewAll}>
          View all jobs
        </a>
      </div>

      <div className={s.card}>
        <ul className={s.list}>
          {openings.map((opening, index) => (
            <JobRow key={opening.role.uid} opening={opening} position={index} />
          ))}
        </ul>
      </div>
    </section>
  );
}

interface JobRowProps {
  opening: ILatestJobOpening;
  position: number;
}

function JobRow({ opening, position }: JobRowProps) {
  const { role, team } = opening;
  const analytics = useJobsAnalytics();

  const date = getJobDate(role);
  const relative = formatRelativeDays(date);
  const showNew = isNew(date);
  const location = role.location.filter(Boolean).join(', ');
  const metaParts = [
    role.seniority ? seniorityDisplayLabel(role.seniority) : null,
    role.roleCategory,
    location || null,
  ].filter(Boolean);

  const onClick = () => {
    analytics.onJobClicked({
      job_id: role.uid,
      team_id: team.uid,
      team_name: team.name,
      role_title: role.roleTitle,
      role_category: role.roleCategory,
      seniority: role.seniority,
      focus_areas: team.focusAreas,
      position_in_list: position,
      filter_state: {},
    });
  };

  const linkProps: HTMLProps<HTMLAnchorElement> = role.applyUrl
    ? { href: `${role.applyUrl}?${JOB_QUERY_PARAMS}`, target: '_blank', rel: 'noopener noreferrer', onClick }
    : {};

  return (
    <li className={s.row}>
      <div className={s.avatar}>
        {team.logoUrl ? (
          <img className={s.avatarImage} src={team.logoUrl} alt="" loading="lazy" />
        ) : (
          <span className={s.avatarInitials}>{teamInitials(team.name)}</span>
        )}
      </div>

      <div className={s.body}>
        <a className={s.roleTitle} {...linkProps}>
          {role.roleTitle}
        </a>
        <div className={s.meta}>
          <span className={s.teamName}>{team.name}</span>
          {!isEmpty(metaParts) && (
            <>
              <span className={s.dot} aria-hidden="true" />
              <span>{metaParts.join(' · ')}</span>
            </>
          )}
        </div>
      </div>

      <div className={s.right}>
        {showNew && <span className={s.newBadge}>● New</span>}
        {relative && <span className={s.relative}>{relative}</span>}
        <a className={s.applyArrow} aria-label={`Apply to ${role.roleTitle}`} {...linkProps}>
          <ArrowIcon />
        </a>
      </div>
    </li>
  );
}
