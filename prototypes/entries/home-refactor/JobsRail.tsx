'use client';

import clsx from 'clsx';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
// Production Job Board "View all N …" expander, as the feed's HiringCard uses it.
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import refer from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
import { ArrowIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { JOB_QUERY_PARAMS } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import feed from '../newsfeed/Newsfeed.module.scss';
import local from './HomeRefactorPrototype.module.scss';

import type { HomeJob } from './mocks';

const JOB_BOARD = '/prototypes/job-board';

/**
 * Jobs as a short list, not a board. The rows are the feed HiringCard's
 * (`feed.roleRow` / `.roleTitle` / `.roleLocation` / `.roleArrow`, the title a
 * ReferRoleRow `.titleLink` to the posting with production's query params), with
 * the team's logo + name added because the rows here span teams. The card is
 * the feed rail's (`v0.railCard`), so on desktop it reads as a rail module.
 */
export function JobsRail({ jobs, total }: { jobs: HomeJob[]; total: number }) {
  return (
    <section className={clsx(s.card, v0.railCard, local.jobsCard)} aria-labelledby="home-jobs-title">
      <div className={local.railHead}>
        <h2 id="home-jobs-title" className={v0.railTitle}>
          Open roles in the network
        </h2>
      </div>

      <ul className={feed.roleList}>
        {jobs.map((job) => (
          <li key={`${job.teamUid}-${job.title}`} className={clsx(feed.roleRow, local.jobRow)}>
            {job.teamLogoUrl ? (
              <img className={clsx(s.logo, local.jobLogo)} src={job.teamLogoUrl} alt="" loading="lazy" />
            ) : (
              <div className={clsx(s.logoFallback, local.jobLogo)}>{getTeamLogoFallback(job.teamName)}</div>
            )}
            <span className={local.jobText}>
              <a
                href={`${job.applyUrl}?${JOB_QUERY_PARAMS}`}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(refer.titleLink, feed.roleTitle, local.jobTitle)}
              >
                {job.title}
              </a>
              <span className={feed.roleLocation}>
                {job.teamName} · {job.location}
              </span>
            </span>
            <span className={feed.roleArrow} aria-hidden>
              <ArrowIcon />
            </span>
          </li>
        ))}
      </ul>

      <a href={JOB_BOARD} className={clsx(jobsCss.expander, v0.viewAllExpander)}>
        See all {total} jobs
      </a>
    </section>
  );
}
