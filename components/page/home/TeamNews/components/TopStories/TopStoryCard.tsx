'use client';

import type { SVGProps } from 'react';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { useCurrentUserStore } from '@/services/auth/store';
import { useCardVisibilityTracking } from '@/hooks/useCardVisibilityTracking';
import { FollowButton } from '@/components/ui/FollowButton';
import type { TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { getEventTypeConfig } from '../../utils/getEventTypeConfig';
import { hasNewsSource } from '../../utils/getNewsSources';
import { UpvoteButton } from '../NewsCard/components/UpvoteButton';
import { CommentButton } from '../NewsCard/components/CommentButton/CommentButton';
import { NewsShareMenu } from '../NewsShareMenu';
import { SourceList } from '../SourceList/SourceList';
import { ViewCount } from '../ViewCount/ViewCount';

import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import s from './TopStories.module.scss';

/**
 * Filled pin. `@/components/icons/PushPinIcon` is the hairline outline at 24px —
 * at eyebrow size its 1px contour dissolves into the uppercase letterforms next
 * to it. This is the same diagonal pin production ships filled at 12px
 * (`public/icons/pin-black.svg`), transcribed so the geometry stays production's;
 * only the hardcoded `#64748B` becomes `currentColor` so it inherits the brand
 * blue from `.badge`. Pin rather than sparkles — nothing here is AI-picked.
 */
function PinFilledIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8.07526 0.140046L8.13792 0.19538L11.8046 3.86205C11.917 3.97503 11.9852 4.12453 11.9968 4.28347C12.0085 4.4424 11.9628 4.60025 11.8681 4.72841C11.7734 4.85657 11.6359 4.94657 11.4805 4.98209C11.3252 5.01761 11.1623 4.99631 11.0213 4.92205L8.90659 7.03605L7.95726 9.56738C7.93225 9.63417 7.89669 9.69652 7.85192 9.75205L7.80526 9.80538L6.80526 10.8054C6.69038 10.9201 6.5376 10.9889 6.37558 10.999C6.21357 11.009 6.05345 10.9596 5.92526 10.86L5.86192 10.8047L3.99992 8.94338L1.47126 11.4714C1.35128 11.5909 1.1903 11.6604 1.021 11.6655C0.851701 11.6707 0.686781 11.6112 0.559737 11.4992C0.432694 11.3872 0.353053 11.231 0.33699 11.0624C0.320928 10.8938 0.369648 10.7254 0.473256 10.5914L0.52859 10.5287L3.05659 8.00005L1.19526 6.13805C1.08047 6.02325 1.01152 5.87052 1.00133 5.7085C0.991143 5.54648 1.04042 5.38632 1.13992 5.25805L1.19526 5.19538L2.19526 4.19538C2.24556 4.1449 2.30363 4.10281 2.36726 4.07071L2.43259 4.04271L4.96326 3.09271L7.07726 0.97938C7.00517 0.844601 6.98158 0.689144 7.01045 0.539049C7.03932 0.388954 7.11888 0.253336 7.23582 0.154911C7.35276 0.0564862 7.49997 0.00123267 7.65279 -0.00159482C7.80561 -0.00442232 7.95476 0.0460147 8.07526 0.140046Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface TopStoryCardProps {
  story: ITeamNewsItem;
  /** e.g. "Last 14 days" — the window the ranking was taken over, stated so the
   *  claim "top" is bounded by something the reader can see. */
  windowLabel: string;
  /** True when there are no runners-up, so the lead rounds its own bottom corners. */
  isOnly: boolean;
  isFollowing: boolean;
  onFollowToggle: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
  onUpvoteToggle: (item: ITeamNewsItem) => void;
  onOpen: (item: ITeamNewsItem) => void;
  /** Fired once this card scrolls into the viewport (view-impression recording). */
  onVisible: (uid: string) => void;
  analyticsSource?: TeamNewsAnalyticsSource;
}

/**
 * The window's lead story, above the feed.
 *
 * Visibly a different object from a feed card rather than a larger one: a brand
 * eyebrow, a 24px headline, and a full (unclamped) summary inside a band that
 * carries its own border.
 *
 * The prototype's "why this won" line and curation attribution are deliberately
 * absent — this pick is ranked by network likes, so there is no editor to
 * attribute it to and no written rationale to show. An honest omission beats a
 * fabricated one; see the brainstorm.
 */
export function TopStoryCard({
  story,
  windowLabel,
  isOnly,
  isFollowing,
  onFollowToggle,
  onUpvoteToggle,
  onOpen,
  onVisible,
  analyticsSource = 'home',
}: TopStoryCardProps) {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { label: eventTypeLabel, dotClassName } = getEventTypeConfig(story.eventType);

  // Memoized so this row's IntersectionObserver isn't torn down/rebuilt on
  // every unrelated re-render — an inline arrow here would be a fresh
  // reference every render, and useCardVisibilityTracking's effect depends
  // on `onVisible`.
  const handleVisible = useCallback(() => onVisible(story.uid), [onVisible, story.uid]);
  const cardRef = useCardVisibilityTracking<HTMLElement>({ onVisible: handleVisible, threshold: 0.5, trackOnce: true });

  const requireSignIn = () => {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return requireSignIn();
    onFollowToggle(story.teamUid, story.teamName, isFollowing);
  };

  const handleUpvoteClick = () => {
    if (!currentUser) return requireSignIn();
    onUpvoteToggle(story);
  };

  return (
    <article ref={cardRef} className={isOnly ? `${s.lead} ${s.leadOnly}` : s.lead}>
      <div className={s.eyebrow}>
        <span className={s.badge}>
          <PinFilledIcon className={s.badgeIcon} aria-hidden />
          Top stories
        </span>
        <span className={s.window}>{windowLabel}</span>
      </div>

      {/* Outside the click target below, so the lead holds no interactive
          element inside another — the same split NewsGroupCard uses between its
          head row and its story rows. */}
      <div className={newsCardStyles.head}>
        {story.teamLogoUrl ? (
          <img className={newsCardStyles.logo} src={story.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={newsCardStyles.logoFallback}>{getTeamLogoFallback(story.teamName)}</div>
        )}
        <a
          href={`/teams/${story.teamUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={newsCardStyles.teamName}
        >
          {story.teamName}
        </a>
        {isHydrated && (
          <FollowButton following={isFollowing} onClick={handleFollowClick} name={story.teamName} size="compact" />
        )}
      </div>

      {/* Concise accessible name: without it the button's name is its entire text
          content (title + summary), which is screen-reader noise. */}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={story.title}
        className={s.leadBody}
        onClick={() => onOpen(story)}
      >
        <h2 className={s.leadTitle}>{story.title}</h2>
        {story.summary && <p className={s.leadSummary}>{story.summary}</p>}
      </button>

      <div className={newsCardStyles.metaLine}>
        <div className={newsCardStyles.meta}>
          <span className={newsCardStyles.eventType}>
            <span className={`${newsCardStyles.eventDot} ${dotClassName}`} aria-hidden="true" />
            <span className={newsCardStyles.eventLabel}>{eventTypeLabel}</span>
          </span>
          {hasNewsSource(story) && (
            <>
              <span className={newsCardStyles.sep} aria-hidden="true" />
              <SourceList item={story} position={0} analyticsSource={analyticsSource} />
            </>
          )}
          <span className={newsCardStyles.sep} aria-hidden="true" />
          <span className={newsCardStyles.time}>{formatTimeAgo(story.eventDate)}</span>
        </div>
        <div className={newsCardStyles.actions}>
          <NewsShareMenu item={story} source={analyticsSource} />
          <ViewCount count={story.viewCount} />
          <UpvoteButton
            count={story.upvoteCount ?? 0}
            voted={Boolean(story.viewerHasUpvoted)}
            onToggle={handleUpvoteClick}
          />
          {/* The band has no inline thread: an expanding thread here would push
              the runners-up a screen down. Comments live in the detail modal. */}
          <CommentButton itemUid={story.uid} open={false} onToggle={() => onOpen(story)} opensDetail />
        </div>
      </div>
    </article>
  );
}
