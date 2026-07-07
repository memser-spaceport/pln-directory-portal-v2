'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { hasExistingDiscussion } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/utils/hasExistingDiscussion';
import { ArrowRight } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/components/Icons';

// Reuse the production news-card styling 1:1.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import discussStyles from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/StartConversationButton.module.scss';
// Reuse the production Job Board "View all N …" expander styling 1:1.
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
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

interface V0FeedCardProps {
  cluster: TeamCluster;
  following: boolean;
  onToggleFollow: () => void;
  /** V1 only — V0 ships without the upvote feature. */
  showUpvote?: boolean;
}

/**
 * Single-column variant: one card per team, but every story inside carries
 * equal weight — same headline size, summary, meta line, and (in V1) its own
 * quiet upvote/comment pair. No lead: with no hierarchy to express, ordering
 * is pure chronology (newest first).
 */
// Show at most this many stories per card; the rest collapse under "+N more".
const VISIBLE_STORIES = 3;

export function V0FeedCard({ cluster, following, onToggleFollow, showUpvote = false }: V0FeedCardProps) {
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

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
                  <>
                    <span className={local.sourceDomain}>{story.sourceDomain}</span>
                    {' · '}
                  </>
                )}
                {formatTimeAgo(story.eventDate)}
              </span>
              <span className={local.footerActions} onClick={(e) => e.stopPropagation()}>
                {showUpvote && <UpvoteButton count={upvotes} voted={voted} onToggle={() => toggleVote(story.uid)} />}
                {/* Production's StartConversationButton treatment: DS link/primary —
                    brand blue at rest, darkening on hover. (The real component also
                    reads auth + forum access and navigates, out of scope for mocked data.) */}
                <Button
                  size="xs"
                  style="link"
                  variant="primary"
                  className={discussStyles.discussLink}
                  title={
                    existing ? 'Join the existing forum discussion about this article' : 'Start a conversation on the forum'
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  {existing ? 'Join discussion' : 'Discuss'}
                  <ArrowRight />
                </Button>
              </span>
            </div>
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
