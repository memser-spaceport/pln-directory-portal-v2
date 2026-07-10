'use client';

import { useLayoutEffect, useMemo } from 'react';
import { useToggle } from 'react-use';
import { useRouter } from 'next/navigation';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { useCurrentUserStore } from '@/services/auth/store';
import { FollowButton } from '@/components/ui/FollowButton/FollowButton';
import type { ITeamNewsItem, TeamCluster } from '@/types/team-news.types';
import type { TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { getEventTypeConfig } from '../../utils/getEventTypeConfig';
import { sortAllTabItemsByEventDate } from '../../utils/sortAllTabItemsByEventDate';
import { StartConversationButton } from '../NewsCard/components/StartConversationButton';
import { UpvoteButton } from '../NewsCard/components/UpvoteButton';

import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import s from './NewsGroupCard.module.scss';

const VISIBLE_STORIES = 3;

interface NewsGroupCardProps {
  cluster: TeamCluster;
  onStoryClick?: (item: ITeamNewsItem) => void;
  analyticsSource?: TeamNewsAnalyticsSource;
  isFollowing?: boolean;
  onFollowToggle?: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
  onUpvoteToggle?: (item: ITeamNewsItem) => void;
  /** Set by TeamNews.tsx when a "Popular this week" click targets a story inside
   * this card that's beyond VISIBLE_STORIES — forces this card's own truncation
   * open. One-directional (never collapses); see the scroll-to-story plan. */
  autoExpandStoryUid?: string;
}

export function NewsGroupCard({
  cluster,
  onStoryClick,
  analyticsSource = 'home',
  isFollowing = false,
  onFollowToggle,
  onUpvoteToggle,
  autoExpandStoryUid,
}: NewsGroupCardProps) {
  const [expanded, toggleExpanded] = useToggle(false);
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`);
      return;
    }
    onFollowToggle?.(cluster.teamUid, cluster.teamName, isFollowing);
  };

  const handleUpvoteClick = (story: ITeamNewsItem) => {
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`);
      return;
    }
    onUpvoteToggle?.(story);
  };

  // Memoized: reuses the same string-comparison sort as the rest of the
  // feed instead of a bespoke Date.getTime() comparator, and avoids
  // re-sorting on every unrelated render.
  const stories = useMemo(() => sortAllTabItemsByEventDate(cluster.items), [cluster.items]);
  const hiddenCount = Math.max(0, stories.length - VISIBLE_STORIES);
  const visibleStories = expanded ? stories : stories.slice(0, VISIBLE_STORIES);

  // useLayoutEffect, not useEffect: this must commit synchronously within the
  // flushSync call TeamNews.tsx's handlePopularItemClick wraps its state updates
  // in, so the parent's very next line (a synchronous querySelector, no polling)
  // can rely on this card already being expanded. Only ever force-opens, never
  // collapses — safe to re-run.
  useLayoutEffect(() => {
    if (!autoExpandStoryUid) return;
    const isBeyondVisible = stories.slice(VISIBLE_STORIES).some((story) => story.uid === autoExpandStoryUid);
    if (isBeyondVisible) toggleExpanded(true);
  }, [autoExpandStoryUid, stories, toggleExpanded]);

  const openStory = (item: ITeamNewsItem) => {
    onStoryClick?.(item);
    window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={newsCardStyles.card}>
      <div className={newsCardStyles.head}>
        {cluster.teamLogoUrl ? (
          <img className={newsCardStyles.logo} src={cluster.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={newsCardStyles.logoFallback}>{getTeamLogoFallback(cluster.teamName)}</div>
        )}
        <a
          href={`/teams/${cluster.teamUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={newsCardStyles.teamName}
          onClick={(e) => e.stopPropagation()}
        >
          {cluster.teamName}
        </a>
        {isHydrated && onFollowToggle && (
          <FollowButton following={isFollowing} onClick={handleFollowClick} name={cluster.teamName} size="compact" />
        )}
      </div>

      {visibleStories.map((story, storyIndex) => {
        const { label, dotClassName } = getEventTypeConfig(story.eventType);
        return (
          <div
            key={story.uid}
            data-story-uid={story.uid}
            role="link"
            tabIndex={0}
            className={s.storyRow}
            onClick={() => openStory(story)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openStory(story);
              }
            }}
          >
            <h3 className={newsCardStyles.headline}>{story.title}</h3>
            {story.summary && <p className={s.summary}>{story.summary}</p>}
            <div className={newsCardStyles.metaLine}>
              <div className={newsCardStyles.meta}>
                <span className={newsCardStyles.eventType}>
                  <span className={`${newsCardStyles.eventDot} ${dotClassName}`} aria-hidden="true" />
                  <span className={newsCardStyles.eventLabel}>{label}</span>
                </span>
                {story.sourceDomain && (
                  <>
                    <span className={newsCardStyles.sep} aria-hidden="true" />
                    <span className={newsCardStyles.source}>{story.sourceDomain}</span>
                  </>
                )}
                <span className={newsCardStyles.sep} aria-hidden="true" />
                <span className={newsCardStyles.time}>{formatTimeAgo(story.eventDate)}</span>
              </div>
              <div className={newsCardStyles.actions}>
                <UpvoteButton
                  count={story.upvoteCount ?? 0}
                  voted={Boolean(story.viewerHasUpvoted)}
                  onToggle={() => handleUpvoteClick(story)}
                />
                {/* `position` is this story's own index within its card, not the
                    card's index — see TeamNews.tsx's handleCardClick for the
                    card-level position used in onTeamNewsCardClicked. */}
                <StartConversationButton item={story} position={storyIndex} analyticsSource={analyticsSource} />
              </div>
            </div>
          </div>
        );
      })}

      {hiddenCount > 0 && (
        <button type="button" className={s.expander} aria-expanded={expanded} onClick={toggleExpanded}>
          {expanded ? 'Show less' : `View all ${stories.length} updates from ${cluster.teamName}`}
        </button>
      )}
    </div>
  );
}
