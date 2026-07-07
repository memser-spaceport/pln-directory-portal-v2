'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/components/NewsCard/utils/getTeamLogoFallback';
import { hasExistingDiscussion } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/utils/hasExistingDiscussion';

// Reuse the production news-card styling 1:1.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import local from './NewsfeedV0.module.scss';

import { FollowButton } from '../follow-shared/FollowButton';
import { EVENT_TYPE_LABEL } from './eventMeta';
import { UPVOTES } from './mocks';
import { UpvoteButton, type TeamCluster } from './V0NewsCard';

// Same event-color mapping as the grid card.
const KICKER_COLOR_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: 'kFunding',
  LAUNCH: 'kLaunch',
  PARTNERSHIP: 'kPartnership',
  ANNOUNCEMENT: 'kAnnouncement',
  MILESTONE: 'kMilestone',
  OTHER: 'kAnnouncement',
};

const openSource = (item: ITeamNewsItem) => window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');

const sourceAndTime = (item: ITeamNewsItem) =>
  item.sourceDomain ? `${item.sourceDomain} · ${formatTimeAgo(item.eventDate)}` : formatTimeAgo(item.eventDate);

interface V0FeedCardProps {
  cluster: TeamCluster;
  following: boolean;
  onToggleFollow: () => void;
}

/**
 * Single-column variant: one card per team, but every story inside carries
 * equal weight — same headline size, summary, meta line, and its own quiet
 * upvote/comment pair. No lead: with no hierarchy to express, ordering is
 * pure chronology (newest first).
 */
export function V0FeedCard({ cluster, following, onToggleFollow }: V0FeedCardProps) {
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  const toggleVote = (uid: string) =>
    setVotedIds((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  const upvotesFor = (item: ITeamNewsItem) => (UPVOTES[item.uid] ?? 0) + (votedIds.has(item.uid) ? 1 : 0);

  const stories = [cluster.lead, ...cluster.rest].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );

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
          className={s.teamName}
          onClick={(e) => e.stopPropagation()}
        >
          {cluster.teamName}
        </a>
        <span className={local.headFollow}>
          <FollowButton following={following} onClick={onToggleFollow} name={cluster.teamName} size="xs" tertiary />
        </span>
      </div>

      {stories.map((story) => {
        const existing = hasExistingDiscussion(story.discussion);
        const voted = votedIds.has(story.uid);
        const upvotes = upvotesFor(story);
        return (
          <div
            key={story.uid}
            role="link"
            tabIndex={0}
            className={local.feedStory}
            onClick={() => openSource(story)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openSource(story);
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
                {story.sourceDomain && (
                  <img
                    className={local.favicon}
                    src={`https://www.google.com/s2/favicons?domain=${story.sourceDomain}&sz=32`}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                {sourceAndTime(story)}
              </span>
              <span className={local.footerActions} onClick={(e) => e.stopPropagation()}>
                <UpvoteButton count={upvotes} voted={voted} onToggle={() => toggleVote(story.uid)} />
                <button
                  type="button"
                  className={local.moreComments}
                  title={
                    existing ? 'Join the existing forum discussion about this article' : 'Start a conversation on the forum'
                  }
                  aria-label={
                    existing
                      ? `${story.discussion.count} ${story.discussion.count === 1 ? 'comment' : 'comments'} — join the forum discussion`
                      : 'Start a conversation on the forum'
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChatIcon />
                  {existing ? story.discussion.count : null}
                </button>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Same glyphs as the grid card (module-local there).
const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 2.2c-3.5 0-6.3 2.38-6.3 5.31 0 1.68.93 3.18 2.38 4.16-.08.66-.36 1.5-.98 2.08 0 0 1.5.04 2.87-1.03.65.16 1.33.25 2.03.25 3.5 0 6.3-2.38 6.3-5.31S11.5 2.2 8 2.2z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);
