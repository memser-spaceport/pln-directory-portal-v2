'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { useCurrentUserStore } from '@/services/auth/store';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/common/Badge';
import { FollowButton } from '@/components/ui/FollowButton';
import { jobDetailPath } from '@/services/jobs/job-detail-link';
import { ReferRoleRow } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow';
import type { TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';

import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { hiringGroupDate } from '../../utils/injectFeedSignals';

import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import s from './HiringCard.module.scss';

/** Roles named on the card; the rest roll into the expander. */
const VISIBLE_ROLES = 3;

/**
 * Structurally unreachable, and passed anyway because `RowApplyProps` requires
 * it: `ReferRoleRow` renders **View job** in place of Apply whenever
 * `onViewJob` is present, so the Apply branch this would feed is never taken.
 * Apply belongs at the bottom of the description it applies to — which here is
 * on the board, in the tab View job opens.
 */
const NEVER_APPLIES_FROM_THE_FEED = () => {};

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
 * The rows themselves ARE the board's rows — `ReferRoleRow`, the same component
 * `TeamGroupCard` renders, so a role reads and behaves identically wherever it
 * is met: seniority · function · location under the title, the posting's age,
 * Refer, share, View job. A hand-rolled lookalike drifted from the board once
 * already; this cannot.
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

  /**
   * View job leaves for the board rather than opening a drawer here.
   *
   * The feed is a scanning surface and the flow behind that drawer is not — it
   * runs a sign-in gate, a profile check and a cover letter, and `router.refresh()`
   * from inside it would re-fetch the whole home page under the reader. A new
   * tab keeps the feed they were scanning exactly where it was, and lands them
   * on `/jobs?job=<uid>`, where the board opens the same drawer from the URL.
   *
   * `window.open` rather than an `<a>` because the row's View job is a
   * `<button>` — see `ReferRoleRow`, where the title and the button are
   * deliberately one door with two handles.
   */
  const openOnBoard = (role: IJobRole, position: number) => {
    onRoleClick?.(group, role, position);
    window.open(jobDetailPath(role.uid), '_blank', 'noopener,noreferrer');
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

      {/* `<li>` wrappers because `ReferRoleRow` renders a `<div>`: the board puts
          those straight inside its own `<ul>`, which is invalid markup this card
          does not need to inherit. The row stretches to fill the item, so the
          wrapper costs no styling. */}
      <ul className={s.roleList}>
        {visibleRoles.map((role, index) => (
          <li key={role.uid}>
            <ReferRoleRow
              role={role}
              teamId={team.uid}
              teamName={team.name}
              team={team}
              currentUser={currentUser}
              source="home-feed"
              /* Built per row so the analytics position survives: `onViewJob`'s
                 target carries the role but not its index in this card. */
              apply={{
                onApply: NEVER_APPLIES_FROM_THE_FEED,
                memberUid: currentUser?.uid,
                onViewJob: (target) => openOnBoard(target.role, index),
              }}
            />
          </li>
        ))}
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
