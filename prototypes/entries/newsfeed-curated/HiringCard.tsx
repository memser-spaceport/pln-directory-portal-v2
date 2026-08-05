'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';

import { Badge } from '@/components/common/Badge';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Production news-card shell, reused 1:1 so a hiring signal sits in the feed as
// a peer of a news card rather than as a foreign object.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
// Production Job Board "View all N …" expander, reused 1:1.
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
// The job board's own role-link affordance and attribution, reused rather than
// re-derived. `.titleLink` is behaviour-only (underline on hover, inherited
// colour), so it doesn't drag the board's 16px title size into this compact row.
import refer from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
import { ArrowIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { JOB_QUERY_PARAMS } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
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
        {/* The kind of object, at the top where the eye lands — not in the footer,
            where news puts its event type and where you've already read the card
            as news by the time you get there. */}
        <Badge className={clsx(local.kindBadge, local.kindHiring)} noBorder>
          Hiring
        </Badge>
        <span className={v0.headFollow}>
          <FollowButton following={following} onClick={onToggleFollow} name={signal.teamName} size="xs" tertiary />
        </span>
      </div>

      <div className={local.hiringBody}>
        {/* The headline is the card's own click target — it goes to this team's
            roles on /jobs, the same place the expander below points. */}
        <h3 className={clsx(s.headline, v0.feedTitle)}>
          <a
            href={`/jobs?team=${signal.teamUid}`}
            target="_blank"
            rel="noopener noreferrer"
            className={local.hiringHeadlineLink}
          >
            {signal.teamName} {signal.headline}
          </a>
        </h3>
        <p className={local.hiringTrend}>{signal.trend}</p>

        {/* Each role links to its own posting, which is production's actionable
            unit too — `ReferRoleRow` makes the title an anchor to
            `applyUrl` + JOB_QUERY_PARAMS. Reusing the query params keeps a click
            from the feed attributed exactly like a click from the board. */}
        <ul className={local.roleList}>
          {signal.roles.map((role) => (
            <li key={role.title} className={local.roleRow}>
              <a
                href={`${role.applyUrl}?${JOB_QUERY_PARAMS}`}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(refer.titleLink, local.roleTitle)}
              >
                {role.title}
              </a>
              <span className={local.roleRight}>
                <span className={local.roleLocation}>{role.location}</span>
                <span className={local.roleArrow} aria-hidden>
                  <ArrowIcon />
                </span>
              </span>
            </li>
          ))}
        </ul>

        {hidden > 0 && (
          <a
            href={`/jobs?team=${signal.teamUid}`}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(jobsCss.expander, v0.viewAllExpander, local.viewAllLeftMobile)}
          >
            View all {signal.totalRoles} open roles at {signal.teamName}
          </a>
        )}

        <div className={v0.footer}>
          {/* The label moved to the head row, so the footer carries only the
              facts — no duplicate badge. */}
          <span className={v0.source}>
            {signal.totalRoles} open {signal.totalRoles === 1 ? 'role' : 'roles'}
            {' · '}
            {formatTimeAgo(signal.date)}
          </span>
        </div>
      </div>
    </div>
  );
}
