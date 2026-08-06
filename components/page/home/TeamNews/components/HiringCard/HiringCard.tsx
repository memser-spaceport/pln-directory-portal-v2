'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { useCurrentUserStore } from '@/services/auth/store';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/common/Badge';
import { FollowButton } from '@/components/ui/FollowButton';
import { JOB_QUERY_PARAMS } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
import { ArrowIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import type { TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';

import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { hiringGroupDate } from '../../utils/injectFeedSignals';

import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import s from './HiringCard.module.scss';

/** Roles named on the card; the rest roll into the expander. */
const VISIBLE_ROLES = 3;

interface HiringCardProps {
  group: IJobTeamGroup;
  isFollowing: boolean;
  onFollowToggle: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
  onRoleClick?: (group: IJobTeamGroup, role: IJobRole, position: number) => void;
  onViewAllClick?: (group: IJobTeamGroup) => void;
  analyticsSource?: TeamNewsAnalyticsSource;
}

/**
 * Hiring as a *signal*, not a listing.
 *
 * Pasting job rows into a news feed mixes two reading modes — news is scanned,
 * jobs are searched — and /jobs already does the second one well. What belongs
 * in a feed is the derived fact: this team's hiring moved. One roll-up per team;
 * the click-through hands off to /jobs rather than reproducing it.
 *
 * The prototype's trend line ("First open roles in 8 months") is deliberately
 * absent: a 14-day window cannot see eight months of history, so there is
 * nothing to derive it from. The footer states only what the window knows.
 */
export function HiringCard({
  group,
  isFollowing,
  onFollowToggle,
  onRoleClick,
  onViewAllClick,
  analyticsSource = 'home',
}: HiringCardProps) {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();

  const { team, totalRoles, roles } = group;
  const visibleRoles = roles.slice(0, VISIBLE_ROLES);
  const hiddenCount = totalRoles - visibleRoles.length;
  const teamJobsUrl = `/jobs?team=${team.uid}`;

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
      return;
    }
    onFollowToggle(team.uid, team.name, isFollowing);
  };

  return (
    <div className={clsx(newsCardStyles.card, s.card)}>
      <div className={newsCardStyles.head}>
        {team.logoUrl ? (
          <img className={newsCardStyles.logo} src={team.logoUrl} alt="" loading="lazy" />
        ) : (
          <div className={newsCardStyles.logoFallback}>{getTeamLogoFallback(team.name)}</div>
        )}
        <a href={`/teams/${team.uid}`} target="_blank" rel="noopener noreferrer" className={newsCardStyles.teamName}>
          {team.name}
        </a>
        {/* The kind of object, at the top where the eye lands — not in the
            footer, where news puts its event type and where the card has
            already been read as news by the time you get there. */}
        <Badge className={s.kindBadge} noBorder>
          Hiring
        </Badge>
        {isHydrated && (
          <FollowButton following={isFollowing} onClick={handleFollowClick} name={team.name} size="compact" />
        )}
      </div>

      <h3 className={clsx(newsCardStyles.headline, s.headline)}>
        <a href={teamJobsUrl} target="_blank" rel="noopener noreferrer" className={s.headlineLink}>
          {team.name} is hiring
        </a>
      </h3>

      {/* Each role links to its own posting — production's actionable unit too
          (ReferRoleRow makes the title an anchor to applyUrl + JOB_QUERY_PARAMS).
          Reusing the query params keeps a click from the feed attributed
          exactly like a click from the board. */}
      <ul className={s.roleList}>
        {visibleRoles.map((role, index) => {
          const location = role.location.filter(Boolean).join(', ');
          return (
            <li key={role.uid} className={s.roleRow}>
              {/* A role can come back without an apply link. Plain text then —
                  never an anchor with nowhere to go. */}
              {role.applyUrl ? (
                <a
                  href={`${role.applyUrl}?${JOB_QUERY_PARAMS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.roleTitleLink}
                  onClick={() => onRoleClick?.(group, role, index)}
                >
                  {role.roleTitle}
                </a>
              ) : (
                <span className={s.roleTitle}>{role.roleTitle}</span>
              )}
              <span className={s.roleRight}>
                {location && <span className={s.roleLocation}>{location}</span>}
                <span className={s.roleArrow} aria-hidden>
                  <ArrowIcon />
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {hiddenCount > 0 && (
        <a
          href={teamJobsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={s.expander}
          onClick={() => onViewAllClick?.(group)}
        >
          View all {totalRoles} open roles at {team.name}
        </a>
      )}

      <div className={newsCardStyles.metaLine}>
        <div className={newsCardStyles.meta}>
          <span className={newsCardStyles.time}>
            {totalRoles} open {totalRoles === 1 ? 'role' : 'roles'}
          </span>
          <span className={newsCardStyles.sep} aria-hidden="true" />
          <span className={newsCardStyles.time}>{formatTimeAgo(hiringGroupDate(group))}</span>
        </div>
      </div>
    </div>
  );
}
