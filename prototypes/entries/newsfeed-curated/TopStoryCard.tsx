'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Production news-card shell (card chrome, logo sizes), reused 1:1.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './NewsfeedCurated.module.scss';

import { EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import { SourceList } from '../newsfeed-v0/SourceList';
import { ShareMenu } from '../newsfeed-v0/ShareMenu';
import { LikeButton } from '../newsfeed-v0/FeedActions';
import { FollowButton } from '../follow-shared/FollowButton';
import type { TopStory } from './mocks';

const KICKER_COLOR_CLASS: Record<ITeamNewsItem['eventType'], string> = {
  FUNDING: 'kFunding',
  LAUNCH: 'kLaunch',
  PARTNERSHIP: 'kPartnership',
  ANNOUNCEMENT: 'kAnnouncement',
  MILESTONE: 'kMilestone',
  OTHER: 'kAnnouncement',
};

const WEEK_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

interface TopStoryCardProps {
  story: ITeamNewsItem;
  top: TopStory;
  /** "Picked by the network team" / "Selected by AI from 47 stories this week". */
  attribution: string;
  /** AI picks disclose their nature; a human pick is just a byline. */
  isAi: boolean;
  following: boolean;
  onToggleFollow: () => void;
  likeCount: number;
  liked: boolean;
  onToggleLike: () => void;
  onOpen: () => void;
  /** Hidden on the "today" spine, where this story never reaches the feed. */
  className?: string;
}

/**
 * The week's single editorial pick, above the feed.
 *
 * Three things make it work, and it is worth nothing without any of them:
 * it is network-wide rather than personalized (a personalized hero is just a
 * better sort — nobody can talk about it); it states *why* it won, because an
 * unexplained pick reads as arbitrary and costs trust in everything below it;
 * and it is visibly a different object from a feed card, not a larger one.
 */
export function TopStoryCard({
  story,
  top,
  attribution,
  isAi,
  following,
  onToggleFollow,
  likeCount,
  liked,
  onToggleLike,
  onOpen,
  className,
}: TopStoryCardProps) {
  const weekOf = new Date(top.weekOf).toLocaleDateString('en-US', WEEK_FORMAT);

  return (
    <section className={clsx(s.card, local.topCard, className)} aria-label="Top story of the week">
      <div className={local.topEyebrow}>
        <span className={local.topBadge}>Top story</span>
        <span className={local.topWeek}>Week of {weekOf}</span>
        <span className={local.topAttribution}>{attribution}</span>
      </div>

      <div
        role="link"
        tabIndex={0}
        className={local.topBody}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <div className={local.topTeamRow}>
          {story.teamLogoUrl ? (
            <img className={s.logo} src={story.teamLogoUrl} alt="" loading="lazy" />
          ) : (
            <div className={s.logoFallback}>{getTeamLogoFallback(story.teamName)}</div>
          )}
          <a
            href={`/teams/${story.teamUid}`}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(s.teamName, v0.teamNameTight)}
            onClick={(e) => e.stopPropagation()}
          >
            {story.teamName}
          </a>
          <span className={v0.headFollow} onClick={(e) => e.stopPropagation()}>
            <FollowButton following={following} onClick={onToggleFollow} name={story.teamName} size="xs" tertiary />
          </span>
        </div>

        <h2 className={local.topTitle}>{story.title}</h2>
        {story.summary && <p className={local.topSummary}>{story.summary}</p>}

        {/* The reasoning, set apart from the story it justifies — this is the
            feature. Without it the hero is just a bigger card. */}
        <div className={local.whyBlock}>
          <span className={local.whyLabel}>Why this made the top</span>
          <p className={local.whyText}>{top.why}</p>
          {isAi && (
            <p className={local.whyDisclosure}>
              Ranked by funding size, network proximity, outlet coverage, and discussion volume. Written by AI from the
              linked sources.
            </p>
          )}
        </div>

        <details className={local.considered} onClick={(e) => e.stopPropagation()}>
          <summary className={local.consideredSummary}>Also considered ({top.alsoConsidered.length})</summary>
          <ul className={local.consideredList}>
            {top.alsoConsidered.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </details>

        <div className={clsx(v0.footer, local.topFooter)}>
          <span className={v0.source}>
            <span className={clsx(v0.metaEvent, v0[KICKER_COLOR_CLASS[story.eventType]])}>
              {EVENT_TYPE_LABEL[story.eventType]}
            </span>
            {' · '}
            <SourceList fallbackDomain={story.sourceDomain} />
            {' · '}
            {formatTimeAgo(story.eventDate)}
          </span>
          <span className={v0.footerActions} onClick={(e) => e.stopPropagation()}>
            <ShareMenu variant="card" url={story.sourceUrl ?? undefined} />
            <LikeButton count={likeCount} liked={liked} onToggle={onToggleLike} />
          </span>
        </div>
      </div>
    </section>
  );
}
