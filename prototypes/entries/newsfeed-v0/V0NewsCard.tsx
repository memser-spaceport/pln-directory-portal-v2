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

// Reuse the Gantry boost-button styling 1:1 (the component itself is label-locked to "Boost").
import gs from '@/components/page/gantry/shared/Shared.module.scss';

import { FollowButton } from '../follow-shared/FollowButton';
import { EVENT_TYPE_LABEL } from './eventMeta';
import { UPVOTES } from './mocks';

/**
 * One card per team, three zones: identity (logo + name, Follow on hover),
 * story (headline + summary), meta (event · source · time / discussion count).
 * The lead story is picked by importance (event-type weight + discussion
 * activity, recency as tie-break); the team's other updates stay visible as a
 * quiet headline stack, each with the same meta shape.
 */
export interface TeamCluster {
  teamUid: string;
  teamName: string;
  teamLogoUrl: string | null;
  lead: ITeamNewsItem;
  /** The team's other items, newest first. */
  rest: ITeamNewsItem[];
  /** False when an older-but-bigger story outranked the newest item. */
  isLeadNewest: boolean;
}

// Event text colors follow the production event-dot palette (NewsCard.module.scss);
// OTHER borrows the announcement gray for contrast at 12px.
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

interface V0NewsCardProps {
  cluster: TeamCluster;
  following: boolean;
  onToggleFollow: () => void;
}

export function V0NewsCard({ cluster, following, onToggleFollow }: V0NewsCardProps) {
  const { lead, rest } = cluster;
  const existing = hasExistingDiscussion(lead.discussion);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  const toggleVote = (uid: string) =>
    setVotedIds((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  const upvotesFor = (item: ITeamNewsItem) => (UPVOTES[item.uid] ?? 0) + (votedIds.has(item.uid) ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openSource(lead);
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      className={clsx(s.card, local.cardRoot)}
      onClick={() => openSource(lead)}
      onKeyDown={handleKeyDown}
    >
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
        <span className={local.headFollow} onClick={(e) => e.stopPropagation()}>
          <FollowButton following={following} onClick={onToggleFollow} name={cluster.teamName} size="xs" tertiary />
        </span>
      </div>

      <h3 className={clsx(s.headline, local.headlineLg)}>{lead.title}</h3>
      {lead.summary && <p className={local.summary}>{lead.summary}</p>}

      <div className={local.footer}>
        <span className={local.source}>
          <span className={clsx(local.metaEvent, local[KICKER_COLOR_CLASS[lead.eventType]])}>
            {EVENT_TYPE_LABEL[lead.eventType]}
          </span>
          {' · '}
          {lead.sourceDomain && (
            <img
              className={local.favicon}
              src={`https://www.google.com/s2/favicons?domain=${lead.sourceDomain}&sz=32`}
              alt=""
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          {sourceAndTime(lead)}
        </span>
        <span className={local.footerActions}>
          <UpvoteButton count={upvotesFor(lead)} voted={votedIds.has(lead.uid)} onToggle={() => toggleVote(lead.uid)} />
          <button
            type="button"
            className={local.discussLink}
            title={existing ? 'Join the existing forum discussion about this article' : 'Start a conversation on the forum'}
            aria-label={
              existing
                ? `${lead.discussion.count} ${lead.discussion.count === 1 ? 'comment' : 'comments'} — join the forum discussion`
                : 'Start a conversation on the forum'
            }
            onClick={(e) => e.stopPropagation()}
          >
            <ChatIcon size={18} />
            {existing ? lead.discussion.count : null}
          </button>
        </span>
      </div>

      {rest.length > 0 && (
        <div className={local.more} onClick={(e) => e.stopPropagation()}>
          {rest.map((m) => (
            <div
              key={m.uid}
              role="link"
              tabIndex={0}
              className={local.moreRow}
              onClick={() => openSource(m)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openSource(m);
                }
              }}
            >
              <span className={local.moreTitle}>{m.title}</span>
              <span className={local.moreMeta}>
                <span className={local.moreMetaText}>{sourceAndTime(m)}</span>
                <button
                  type="button"
                  className={clsx(local.moreComments, votedIds.has(m.uid) && local.rowVoted)}
                  aria-pressed={votedIds.has(m.uid)}
                  aria-label={votedIds.has(m.uid) ? `Remove upvote (${upvotesFor(m)})` : `Upvote (${upvotesFor(m)})`}
                  title={votedIds.has(m.uid) ? 'Remove upvote' : 'Upvote — show the team you find this interesting'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVote(m.uid);
                  }}
                >
                  <ArrowUpIcon strong={votedIds.has(m.uid)} size="lg" />
                  {upvotesFor(m) > 0 && upvotesFor(m)}
                </button>
                {hasExistingDiscussion(m.discussion) && (
                  <button
                    type="button"
                    className={local.moreComments}
                    title="Join the existing forum discussion about this article"
                    aria-label={`${m.discussion.count} ${m.discussion.count === 1 ? 'comment' : 'comments'} — join the forum discussion`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChatIcon size={18} />
                    {m.discussion.count}
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Copy of the Gantry `BoostButton` (its labels are hardcoded to Boost/Boosted)
 * reusing its SCSS 1:1, relabeled Upvote/Upvoted. The count renders only when
 * > 0 — a wall of zeros reads as a dead feed; your own vote makes it appear.
 * Shared with the feed view, where every story carries it.
 */
export function UpvoteButton({ count, voted, onToggle }: { count: number; voted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={clsx(gs.boost, voted && gs.boostActive)}
      aria-pressed={voted}
      aria-label={voted ? `Remove upvote (${count})` : `Upvote (${count})`}
      title={voted ? 'Remove upvote' : 'Upvote — show the team you find this interesting'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <ArrowUpIcon />
      <span className={gs.boostLabel}>{voted ? 'Upvoted' : 'Upvote'}</span>
      {count > 0 && (
        <>
          <span className={gs.boostDivider} aria-hidden />
          <span>{count}</span>
        </>
      )}
    </button>
  );
}

// Same arrow the Gantry BoostButton draws (module-local there, copied verbatim);
// `strong` thickens the stroke for the voted state. `size="sm"` matches Gantry's
// 10×11 (used inside the boost-styled UpvoteButton); `size="lg"` renders 13×14
// with the stroke dialed down so visual weight stays constant as it scales.
const ArrowUpIcon = ({ strong, size = 'sm' }: { strong?: boolean; size?: 'sm' | 'lg' }) => (
  <svg
    width={size === 'lg' ? 13 : 10}
    height={size === 'lg' ? 14 : 11}
    viewBox="0 0 10 11"
    fill="none"
    aria-hidden
  >
    <path
      d="M5 9.5V1.5m0 0L1.5 5.5M5 1.5L8.5 5.5"
      stroke="currentColor"
      strokeWidth={size === 'lg' ? (strong ? 2 : 1.4) : strong ? 2.2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChatIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 2.2c-3.5 0-6.3 2.38-6.3 5.31 0 1.68.93 3.18 2.38 4.16-.08.66-.36 1.5-.98 2.08 0 0 1.5.04 2.87-1.03.65.16 1.33.25 2.03.25 3.5 0 6.3-2.38 6.3-5.31S11.5 2.2 8 2.2z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);
