'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Production news-card shell, reused 1:1 so a hiring signal sits in the feed as
// a peer of a news card rather than as a foreign object.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
// Production Job Board "View all N …" expander, reused 1:1.
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './NewsfeedCurated.module.scss';

import { FollowButton } from '../follow-shared/FollowButton';
import type { HiringSignal } from './mocks';

interface HiringCardProps {
  signal: HiringSignal;
  following: boolean;
  onToggleFollow: () => void;
}

/**
 * Hiring as a *signal*, not a listing.
 *
 * Pasting job rows into a news feed mixes two reading modes — news is scanned,
 * jobs are searched — and /jobs already does the second job well. What belongs
 * in a feed is the derived fact: this team's hiring moved, which for an investor
 * reads as traction. One roll-up per team per week; the click-through hands off
 * to /jobs rather than reproducing it.
 *
 * Sourced from the shape production already returns as
 * `IJobTeamGroup { team, totalRoles, roles[] }` (types/jobs.types.ts).
 */
export function HiringCard({ signal, following, onToggleFollow }: HiringCardProps) {
  const hidden = signal.totalRoles - signal.roles.length;

  return (
    <div className={clsx(s.card, v0.feedCard, local.hiringCard)}>
      <div className={s.head}>
        {signal.teamLogoUrl ? (
          <img className={s.logo} src={signal.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={s.logoFallback}>{getTeamLogoFallback(signal.teamName)}</div>
        )}
        <a
          href={`/teams/${signal.teamUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(s.teamName, v0.teamNameTight)}
        >
          {signal.teamName}
        </a>
        <span className={v0.headFollow}>
          <FollowButton following={following} onClick={onToggleFollow} name={signal.teamName} size="xs" tertiary />
        </span>
      </div>

      <div className={local.hiringBody}>
        <h3 className={clsx(s.headline, v0.feedTitle)}>
          {signal.teamName} {signal.headline}
        </h3>
        <p className={local.hiringTrend}>{signal.trend}</p>

        <ul className={local.roleList}>
          {signal.roles.map((role) => (
            <li key={role.title} className={local.roleRow}>
              <span className={local.roleTitle}>{role.title}</span>
              <span className={local.roleLocation}>{role.location}</span>
            </li>
          ))}
        </ul>

        {hidden > 0 && (
          <a
            href={`/jobs?team=${signal.teamUid}`}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(jobsCss.expander, v0.viewAllExpander)}
          >
            View all {signal.totalRoles} open roles at {signal.teamName}
          </a>
        )}

        <div className={v0.footer}>
          <span className={v0.source}>
            <span className={clsx(v0.metaEvent, local.kHiring)}>Hiring</span>
            {' · '}
            {signal.totalRoles} open {signal.totalRoles === 1 ? 'role' : 'roles'}
            {' · '}
            {formatTimeAgo(signal.date)}
          </span>
        </div>
      </div>
    </div>
  );
}
