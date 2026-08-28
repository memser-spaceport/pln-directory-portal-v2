'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { useCurrentUserStore } from '@/services/auth/store';
import { useCardVisibilityTracking } from '@/hooks/useCardVisibilityTracking';
import { FollowButton } from '@/components/ui/FollowButton';
import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { getEventTypeConfig } from '../../utils/getEventTypeConfig';
import { hasNewsSource } from '../../utils/getNewsSources';
import { UpvoteButton } from '../NewsCard/components/UpvoteButton';
import { CommentButton } from '../NewsCard/components/CommentButton/CommentButton';
import { NewsShareMenu } from '../NewsShareMenu';
import { SourceList } from '../SourceList/SourceList';
import { ViewCount } from '../ViewCount/ViewCount';
import { TopStoryCard } from './TopStoryCard';

import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import s from './TopStories.module.scss';

export type TopStorySlot = 'lead' | 'row';

interface TopStoriesBlockProps {
  lead: ITeamNewsItem;
  /** The runners-up, 0–2. Rendered as rows, not cards. */
  also: ITeamNewsItem[];
  windowLabel: string;
  followedTeamUids: ReadonlySet<string>;
  onFollowToggle: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
  onUpvoteToggle: (item: ITeamNewsItem) => void;
  /** Opens the detail modal. `slot` + `position` are this block's own position
   *  math: block items are not in `visibleEntries`, so the feed's findIndex
   *  would report -1 for every one of them. */
  onStoryOpen: (item: ITeamNewsItem, slot: TopStorySlot, position: number) => void;
  /** Fired once a card (lead or row) scrolls into the viewport (view-impression recording). */
  onStoryVisible: (uid: string) => void;
  analyticsSource?: TeamNewsAnalyticsSource;
}

/**
 * The window's editorial block: one lead plus up to two secondary rows.
 *
 * Asymmetric on purpose — three equal heroes would push the stream under the
 * fold. The lead keeps the eyebrow and the full summary; the runners-up are
 * rows carrying the same anatomy as a feed card (head row, headline, clamped
 * summary, meta) minus the card's own border, because the band supplies it.
 *
 * One band, not three cards: separate cards would read as feed items that
 * happen to sit high, rather than as part of one pick.
 */
export function TopStoriesBlock({
  lead,
  also,
  windowLabel,
  followedTeamUids,
  onFollowToggle,
  onUpvoteToggle,
  onStoryOpen,
  onStoryVisible,
  analyticsSource = 'home',
}: TopStoriesBlockProps) {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const analytics = useTeamNewsAnalytics();

  // Fire-once view event, same guard as NewsRail's popularShownRef — the click
  // events below need a denominator or they measure nothing.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    analytics.onTopStoriesBlockViewed(lead.uid, also.length);
  }, [analytics, lead.uid, also.length]);

  const requireSignIn = () => {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  };

  const handleFollowClick = (item: ITeamNewsItem) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return requireSignIn();
    onFollowToggle(item.teamUid, item.teamName, followedTeamUids.has(item.teamUid));
  };

  const handleUpvoteClick = (item: ITeamNewsItem) => () => {
    if (!currentUser) return requireSignIn();
    onUpvoteToggle(item);
  };

  return (
    <section className={s.block} aria-label="Top stories">
      <TopStoryCard
        story={lead}
        windowLabel={windowLabel}
        isOnly={also.length === 0}
        isFollowing={followedTeamUids.has(lead.teamUid)}
        onFollowToggle={onFollowToggle}
        onUpvoteToggle={onUpvoteToggle}
        onOpen={(item) => onStoryOpen(item, 'lead', 0)}
        onVisible={onStoryVisible}
        analyticsSource={analyticsSource}
      />

      {also.length > 0 && (
        <ul className={s.alsoList}>
          {also.map((item, index) => (
            <AlsoRow
              key={item.uid}
              item={item}
              index={index}
              isFollowing={followedTeamUids.has(item.teamUid)}
              isHydrated={isHydrated}
              analyticsSource={analyticsSource}
              onFollowClick={handleFollowClick(item)}
              onUpvoteClick={handleUpvoteClick(item)}
              onOpen={() => onStoryOpen(item, 'row', index + 1)}
              onVisible={onStoryVisible}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface AlsoRowProps {
  item: ITeamNewsItem;
  index: number;
  isFollowing: boolean;
  isHydrated: boolean;
  analyticsSource: TeamNewsAnalyticsSource;
  onFollowClick: (e: React.MouseEvent) => void;
  onUpvoteClick: () => void;
  onOpen: () => void;
  onVisible: (uid: string) => void;
}

// Extracted so useCardVisibilityTracking has a legal, stable hook call site —
// it can't be called directly inside the `also.map()` callback above (rules
// of hooks). Same file as TopStoriesBlock, not a new one; nothing about this
// row is reused elsewhere.
function AlsoRow({
  item,
  index,
  isFollowing,
  isHydrated,
  analyticsSource,
  onFollowClick,
  onUpvoteClick,
  onOpen,
  onVisible,
}: AlsoRowProps) {
  const { label: eventTypeLabel, dotClassName } = getEventTypeConfig(item.eventType);

  // Memoized so this row's IntersectionObserver isn't torn down/rebuilt on
  // every unrelated re-render of the block.
  const handleVisible = useCallback(() => onVisible(item.uid), [onVisible, item.uid]);
  const rowRef = useCardVisibilityTracking<HTMLLIElement>({ onVisible: handleVisible, threshold: 0.5, trackOnce: true });

  return (
    <li ref={rowRef} className={s.alsoRow}>
      <div className={newsCardStyles.head}>
        {item.teamLogoUrl ? (
          <img className={newsCardStyles.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={newsCardStyles.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
        )}
        <a
          href={`/teams/${item.teamUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={newsCardStyles.teamName}
        >
          {item.teamName}
        </a>
        {isHydrated && (
          <FollowButton following={isFollowing} onClick={onFollowClick} name={item.teamName} size="compact" />
        )}
      </div>

      {/* The headline is the click target, not the row: the row holds a
          Follow button and a team link, and a button can't nest inside
          a button (production hit exactly this in ReferRoleRow). */}
      <button type="button" aria-haspopup="dialog" aria-label={item.title} className={s.alsoTitleBtn} onClick={onOpen}>
        <span className={s.alsoTitle}>{item.title}</span>
      </button>

      {item.summary && <p className={s.alsoSummary}>{item.summary}</p>}

      <div className={newsCardStyles.metaLine}>
        <div className={newsCardStyles.meta}>
          <span className={newsCardStyles.eventType}>
            <span className={`${newsCardStyles.eventDot} ${dotClassName}`} aria-hidden="true" />
            <span className={newsCardStyles.eventLabel}>{eventTypeLabel}</span>
          </span>
          {hasNewsSource(item) && (
            <>
              <span className={newsCardStyles.sep} aria-hidden="true" />
              <SourceList item={item} position={index + 1} analyticsSource={analyticsSource} />
            </>
          )}
          <span className={newsCardStyles.sep} aria-hidden="true" />
          <span className={newsCardStyles.time}>{formatTimeAgo(item.eventDate)}</span>
        </div>
        <div className={newsCardStyles.actions}>
          <NewsShareMenu item={item} source={analyticsSource} />
          <ViewCount count={item.viewCount} />
          <UpvoteButton count={item.upvoteCount ?? 0} voted={Boolean(item.viewerHasUpvoted)} onToggle={onUpvoteClick} />
          <CommentButton itemUid={item.uid} open={false} onToggle={onOpen} opensDetail />
        </div>
      </div>
    </li>
  );
}
