'use client';

import clsx from 'clsx';

import type { ITeamNewsItem } from '@/types/team-news.types';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Reuse the production news-card styling 1:1 (card shell, logo sizes).
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import local from './NewsfeedV0.module.scss';

import { FollowButton } from '../follow-shared/FollowButton';
import { DigestBanner } from './DigestBanner';
import { SUGGESTED_TEAMS, UPVOTES, MOCK_FORUM_POSTS } from './mocks';

interface FeedRailProps {
  followedTeams: Set<string>;
  onToggleFollow: (teamUid: string, teamName: string) => void;
  /** All feed items — the Popular module ranks them by upvotes. */
  allItems: ITeamNewsItem[];
}

/**
 * Left rail for the feed view: follow suggestions (teams not already in the
 * feed) and the week's most-upvoted stories. Follow state is shared with the
 * feed cards, so following here flips the team's button everywhere.
 */
export function FeedRail({ followedTeams, onToggleFollow, allItems }: FeedRailProps) {
  const popular = [...allItems].sort((a, b) => (UPVOTES[b.uid] ?? 0) - (UPVOTES[a.uid] ?? 0)).slice(0, 3);
  // Most-discussed forum threads (engagement = likes + comments).
  const topDiscussions = [...MOCK_FORUM_POSTS]
    .sort((a, b) => b.meta.likes + b.meta.comments - (a.meta.likes + a.meta.comments))
    .slice(0, 3);

  return (
    <>
      <div className={clsx(s.card, local.railCard)}>
        <h3 className={local.railTitle}>Teams to follow</h3>
        {SUGGESTED_TEAMS.map((team) => (
          <div key={team.uid} className={local.railRow}>
            {team.logo ? (
              <img className={s.logo} src={team.logo} alt="" loading="lazy" />
            ) : (
              <div className={s.logoFallback}>{getTeamLogoFallback(team.name)}</div>
            )}
            <span className={local.railInfo}>
              <span className={local.railNameRow}>
                <span className={local.railName}>{team.name}</span>
                <FollowButton
                  following={followedTeams.has(team.uid)}
                  onClick={() => onToggleFollow(team.uid, team.name)}
                  name={team.name}
                  size="xs"
                  tertiary
                />
              </span>
              <span className={local.railReason}>{team.reason}</span>
            </span>
          </div>
        ))}
      </div>

      <div className={clsx(s.card, local.railCard)}>
        <h3 className={local.railTitle}>Popular this week</h3>
        {popular.map((item) => (
          <div
            key={item.uid}
            role="link"
            tabIndex={0}
            className={local.railLinkRow}
            onClick={() => window.open(item.sourceUrl, '_blank', 'noopener,noreferrer')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            {item.teamLogoUrl ? (
              <img className={s.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
            ) : (
              <div className={s.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
            )}
            <span className={local.railStoryBody}>
              <span className={local.railStoryTitle}>{item.title}</span>
              <span className={local.railReason}>
                ↑ {UPVOTES[item.uid] ?? 0} · {item.teamName}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className={clsx(s.card, local.railCard)}>
        <h3 className={local.railTitle}>From the forum</h3>
        {topDiscussions.map((post) => (
          <div
            key={post.tid}
            role="link"
            tabIndex={0}
            className={local.railStory}
            onClick={() => window.open(`https://directory.plnetwork.io/forum/${post.tid}`, '_blank', 'noopener,noreferrer')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.open(`https://directory.plnetwork.io/forum/${post.tid}`, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <span className={local.railStoryTitle}>{post.title}</span>
            <span className={local.railReason}>
              {post.meta.comments} comments · {post.meta.likes} likes
            </span>
          </div>
        ))}
      </div>

      <DigestBanner />
    </>
  );
}
