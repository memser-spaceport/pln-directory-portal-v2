'use client';

import clsx from 'clsx';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import type { IHomeRole } from '@/types/home.types';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
// Production Job Board "View all N …" expander, as the feed's HiringCard uses it.
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import refer from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
import { ArrowIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { jobApplyHref } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';

import { JOBS_HREF } from './constants';
import s from './HomeV2.module.scss';

/**
 * Open roles as a short list, not a board (prototype `JobsRail`, home-refactor/JobsRail.tsx). The rows are the feed
 * HiringCard's, the title a ReferRoleRow `.titleLink` to the posting, with the team's logo and name because the rows
 * span teams. The rail card is the feed rail's; in Home's sidebar it reads as one of its sections.
 */
export function RolesSection({
  roles,
  total,
  note,
  signedIn,
}: {
  roles: IHomeRole[];
  /** Open roles across the whole board: "See all N jobs". */
  total: number;
  /** Signed out: the "Sign up to apply" line. */
  note?: ReactNode;
  signedIn: boolean;
}) {
  const analytics = useHomeAnalytics();

  if (roles.length === 0) return null;

  return (
    <section className={clsx(nc.card, s.railCard)} aria-labelledby="home-jobs-title">
      <div className={s.railHead}>
        <h2 id="home-jobs-title" className={s.railTitle}>
          Open roles in the network
        </h2>
      </div>

      <ul className={s.roleList}>
        {roles.map((job, index) => {
          // The posting itself, with the Home feed's UTM medium; a role without one opens the board.
          const href = jobApplyHref(job.applyUrl, 'home-feed');
          return (
            <li key={job.uid} className={clsx(s.roleRow, s.jobRow)}>
              {job.teamLogoUrl ? (
                <img className={clsx(nc.logo, s.jobLogo)} src={job.teamLogoUrl} alt="" loading="lazy" />
              ) : (
                <div className={clsx(nc.logoFallback, s.jobLogo)}>{getTeamLogoFallback(job.teamName)}</div>
              )}
              <span className={s.jobText}>
                <a
                  href={href ?? JOBS_HREF}
                  {...(href ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={clsx(refer.titleLink, s.roleTitle, s.jobTitle)}
                  onClick={() =>
                    analytics.onRoleClicked({ team_uid: job.teamUid, position: index + 1, signed_in: signedIn })
                  }
                >
                  {job.title}
                </a>
                <span className={s.roleLocation}>
                  {job.teamName}
                  {job.location ? ` · ${job.location}` : ''}
                </span>
              </span>
              <span className={s.roleArrow} aria-hidden>
                <ArrowIcon />
              </span>
            </li>
          );
        })}
      </ul>

      {note}

      <Link
        href={JOBS_HREF}
        className={clsx(jobsCss.expander, s.viewAllExpander)}
        onClick={() => analytics.onSeeAllClicked({ section: 'roles' })}
      >
        See all {total} jobs
      </Link>
    </section>
  );
}
