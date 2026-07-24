'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Reuse the production news-card styling 1:1.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
// Reuse the production Job Board "View all N …" expander styling 1:1.
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import local from './NewsfeedV0.module.scss';

import { FollowButton } from '../follow-shared/FollowButton';
import { EVENT_TYPE_LABEL } from './eventMeta';
import { SOURCES_BY_UID } from './mocks';
import type { FeedComment } from './mocks';
import { SourceList } from './SourceList';
import type { TeamCluster } from './V0NewsCard';
import { LikeButton, CommentButton } from './FeedActions';
import { ShareMenu } from './ShareMenu';
import { CommentsThread } from './CommentsThread';

// Same event-color mapping as the grid card.
const KICKER_COLOR_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: 'kFunding',
  LAUNCH: 'kLaunch',
  PARTNERSHIP: 'kPartnership',
  ANNOUNCEMENT: 'kAnnouncement',
  MILESTONE: 'kMilestone',
  OTHER: 'kAnnouncement',
};

interface V0FeedCardProps {
  cluster: TeamCluster;
  following: boolean;
  onToggleFollow: () => void;
  /** 'with comments' → Like + Share + inline comments; false → Like + Share only. */
  showComments: boolean;
  likeCount: (uid: string) => number;
  isLiked: (uid: string) => boolean;
  onToggleLike: (uid: string) => void;
  commentsFor: (uid: string) => FeedComment[];
  onAddComment: (uid: string, text: string) => void;
  /** Open the story's detail modal (summary + share + sources). */
  onOpenStory: (story: ITeamNewsItem) => void;
}

/**
 * Single-column variant: one card per team, but every story inside carries
 * equal weight — same headline size, summary, meta line, and its own quiet
 * Like + inline-comments controls. Clicking a story opens its detail modal.
 */
// Show at most this many stories per card; the rest collapse under "+N more".
const VISIBLE_STORIES = 3;

export function V0FeedCard({
  cluster,
  following,
  onToggleFollow,
  showComments,
  likeCount,
  isLiked,
  onToggleLike,
  commentsFor,
  onAddComment,
  onOpenStory,
}: V0FeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [openThreads, setOpenThreads] = useState<Set<string>>(new Set());

  const toggleThread = (uid: string) =>
    setOpenThreads((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  const stories = [cluster.lead, ...cluster.rest].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );
  const hiddenCount = Math.max(0, stories.length - VISIBLE_STORIES);
  const visibleStories = expanded ? stories : stories.slice(0, VISIBLE_STORIES);

  return (
    <div className={clsx(s.card, local.feedCard)}>
      <div className={s.head}>
        {cluster.teamLogoUrl ? (
          <img className={s.logo} src={cluster.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={s.logoFallback}>{getTeamLogoFallback(cluster.teamName)}</div>
        )}
        <a
          href={`/teams/${cluster.teamUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(s.teamName, local.teamNameTight)}
          onClick={(e) => e.stopPropagation()}
        >
          {cluster.teamName}
        </a>
        <span className={local.headFollow}>
          <FollowButton following={following} onClick={onToggleFollow} name={cluster.teamName} size="xs" tertiary />
        </span>
      </div>

      {visibleStories.map((story) => {
        const threadOpen = openThreads.has(story.uid);
        const comments = commentsFor(story.uid);
        return (
          <div
            key={story.uid}
            role="link"
            tabIndex={0}
            className={local.feedStory}
            onClick={() => onOpenStory(story)}
            onKeyDown={(e) => {
              // Only the row itself opens the modal — Enter/Space inside the
              // comment composer must not (it bubbles up to this handler).
              if (e.target !== e.currentTarget) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenStory(story);
              }
            }}
          >
            <h3 className={clsx(s.headline, local.feedTitle)}>{story.title}</h3>
            {story.summary && <p className={local.summary}>{story.summary}</p>}
            <div className={local.footer}>
              <span className={local.source}>
                <span className={clsx(local.metaEvent, local[KICKER_COLOR_CLASS[story.eventType]])}>
                  {EVENT_TYPE_LABEL[story.eventType]}
                </span>
                {' · '}
                <SourceList sources={SOURCES_BY_UID[story.uid]} fallbackDomain={story.sourceDomain} />
                {' · '}
                {formatTimeAgo(story.eventDate)}
              </span>
              <span className={local.footerActions} onClick={(e) => e.stopPropagation()}>
                <ShareMenu variant="card" url={story.sourceUrl ?? undefined} />
                <LikeButton
                  count={likeCount(story.uid)}
                  liked={isLiked(story.uid)}
                  onToggle={() => onToggleLike(story.uid)}
                />
                {showComments && (
                  <CommentButton
                    count={comments.length}
                    open={threadOpen}
                    onToggle={() => toggleThread(story.uid)}
                  />
                )}
              </span>
            </div>

            {showComments && threadOpen && (
              <CommentsThread comments={comments} onAddComment={(text) => onAddComment(story.uid, text)} />
            )}
          </div>
        );
      })}

      {/* More than 3 stories: collapse the rest behind the production Job Board's
          "View all N …" expander (inline toggle → "Show less"). */}
      {hiddenCount > 0 && (
        <button
          type="button"
          className={clsx(jobsCss.expander, local.viewAllExpander)}
          aria-expanded={expanded}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? 'Show less' : `View all ${stories.length} updates from ${cluster.teamName}`}
        </button>
      )}
    </div>
  );
}
