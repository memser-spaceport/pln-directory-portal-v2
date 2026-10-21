'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Production news-card styling, reused 1:1 (same as newsfeed's V0FeedCard).
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './ForYouLevers.module.scss';

import { FollowButton } from '../follow-shared/FollowButton';
import { EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import { ShareMenu } from '../newsfeed-v0/ShareMenu';
import { LikeButton } from '../newsfeed-v0/FeedActions';

const KICKER_COLOR_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: 'kFunding',
  LAUNCH: 'kLaunch',
  PARTNERSHIP: 'kPartnership',
  ANNOUNCEMENT: 'kAnnouncement',
  MILESTONE: 'kMilestone',
  OTHER: 'kAnnouncement',
  HIRING: 'kAnnouncement',
  DEALS: 'kAnnouncement',
};

interface ForYouCardProps {
  story: ITeamNewsItem;
  following: boolean;
  /** Absent for the viewer's own team: there's nothing to follow. */
  onToggleFollow?: () => void;
  /** "Why am I seeing this?" — only the explain variant passes it. */
  reason?: string;
  /** Just joined the feed because of something the viewer did. */
  isNew?: boolean;
  liked: boolean;
  onToggleLike: () => void;
}

/**
 * Copy-simplify of newsfeed-v0's `V0FeedCard`: one story, no comments, video,
 * save or detail modal — none of them bear on what this entry tests. Head,
 * headline, summary and footer keep the V0 classes so the card measures like
 * the feed's.
 *
 * The reason sits under the team name, in the head — the slot Instagram and
 * Reddit use for "Suggested for you" — so it reads as a fact about why this
 * team is here, not as a line about the story.
 */
export function ForYouCard({ story, following, onToggleFollow, reason, isNew, liked, onToggleLike }: ForYouCardProps) {
  return (
    <article className={clsx(s.card, v0.feedCard, local.card, isNew && local.cardNew)} data-team={story.teamUid}>
      <div className={s.head}>
        {story.teamLogoUrl ? (
          <img className={s.logo} src={story.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={s.logoFallback}>{getTeamLogoFallback(story.teamName)}</div>
        )}
        <span className={local.headText}>
          <span className={clsx(s.teamName, v0.teamNameTight)}>{story.teamName}</span>
          {reason && <span className={local.reason}>{reason}</span>}
        </span>
        {isNew && <span className={local.newTag}>New in your feed</span>}
        {onToggleFollow && (
          <span className={v0.headFollow}>
            <FollowButton following={following} onClick={onToggleFollow} name={story.teamName} size="xs" tertiary />
          </span>
        )}
      </div>

      <div className={v0.feedStory}>
        <div className={v0.storyText}>
          <h3 className={clsx(s.headline, v0.feedTitle)}>{story.title}</h3>
          {story.summary && <p className={v0.summary}>{story.summary}</p>}
        </div>
        <div className={v0.footer}>
          <span className={v0.source}>
            <span className={clsx(v0.metaEvent, v0[KICKER_COLOR_CLASS[story.eventType]])}>
              {EVENT_TYPE_LABEL[story.eventType]}
            </span>
            {' · '}
            {story.sourceDomain}
            {' · '}
            {formatTimeAgo(story.eventDate)}
          </span>
          <span className={v0.footerActions}>
            <ShareMenu variant="card" url={story.sourceUrl} />
            <LikeButton count={liked ? 1 : 0} liked={liked} onToggle={onToggleLike} />
          </span>
        </div>
      </div>
    </article>
  );
}
