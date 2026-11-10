'use client';

import clsx from 'clsx';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { Badge } from '@/components/common/Badge';
import { FollowButton } from '@/components/ui/FollowButton';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { EVENT_TYPE_LABEL } from '@/components/page/home/TeamNews/utils/getEventTypeConfig';

import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import { CommentCount, LikeButton, ViewCount } from '../newsfeed-v0/FeedActions';
import { viewsFor } from '../newsfeed-v0/mocks';
// The rail's "See all N …" row (production Job Board expander + newsfeed-v0's hairline/centring).
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './HomeV2Prototype.module.scss';

/**
 * Signed-out section 2, from the 2026-10-30 mock: "This week in the network"
 * (with "See all updates →") as one white card of flat news rows. Rows are a
 * transcription of production `NewsCard`'s flat variant (`.cardFlat`, `.head`,
 * `.logo`, `.teamName`, `.headline`, `.summary`, `.metaLine`; classes imported),
 * simplified: no store, analytics or share menu. The mock's changes to it: the
 * time moves to the head row's right end, and the event type becomes a brand
 * Badge (DS) beside the source instead of the dot + label. Views, likes and
 * comments are the feed's own (newsfeed-v0 FeedActions).
 *
 * Signed out, every press that needs an account (Follow, Like) is the sign-up
 * ask; the row itself opens the story, which anyone can read.
 */
export function NewsPreviewList({
  stories,
  likeCount,
  commentCount,
  onOpen,
  onNeedsAccount,
  allHref,
  allCount,
}: {
  stories: ITeamNewsItem[];
  likeCount: (uid: string) => number;
  commentCount: (uid: string) => number;
  onOpen: (story: ITeamNewsItem) => void;
  onNeedsAccount: () => void;
  /** "See all updates": home-v2's news-only page. */
  allHref?: string;
  /** How many stories that page holds, for "See all N updates". */
  allCount?: number;
}) {
  return (
    <section className={local.newsPreview} aria-labelledby="home-news-title">
      <div className={local.sideHead}>
        <h2 id="home-news-title" className={local.sideTitle}>
          This week in the network
        </h2>
        <a href={allHref ?? '/prototypes/homepage?view=news'} className={local.sideLink}>
          See all updates
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
      <div className={local.newsPreviewList}>
        {stories.map((item) => (
          <div
            key={item.uid}
            role="button"
            aria-haspopup="dialog"
            tabIndex={0}
            className={clsx(nc.cardFlat, local.newsPreviewRow)}
            onClick={() => onOpen(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(item);
              }
            }}
          >
            <div className={nc.head}>
              {item.teamLogoUrl ? (
                <img className={nc.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
              ) : (
                <div className={nc.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
              )}
              <span className={nc.teamName}>{item.teamName}</span>
              <FollowButton
                following={false}
                onClick={(e) => {
                  e.stopPropagation();
                  onNeedsAccount();
                }}
                name={item.teamName}
                size="compact"
              />
              <span className={clsx(nc.time, local.newsPreviewTime)}>{formatTimeAgo(item.eventDate)}</span>
            </div>
            <h3 className={nc.headline}>{item.title}</h3>
            {item.summary && <p className={nc.summary}>{item.summary}</p>}
            <div className={nc.metaLine}>
              <div className={nc.meta}>
                <Badge variant="brand" noBorder className={local.newsPreviewBadge}>
                  {EVENT_TYPE_LABEL[item.eventType]}
                </Badge>
                {item.sourceDomain && <span className={nc.time}>{item.sourceDomain}</span>}
              </div>
              <span className={nc.actions} onClick={(e) => e.stopPropagation()}>
                <ViewCount count={viewsFor(item.uid)} compact />
                <LikeButton count={likeCount(item.uid)} liked={false} onToggle={onNeedsAccount} />
                <CommentCount count={commentCount(item.uid)} onClick={() => onOpen(item)} />
              </span>
            </div>
          </div>
        ))}
        {/* 2026-11-05 review (Anuj): the header link alone was easy to miss, so the list
            also ends on it, as the same "See all N …" expander the roles and events beside
            it end on. Both kept (user, same day): the header for scanners, this for readers. */}
        <a
          href={allHref ?? '/prototypes/homepage?view=news'}
          className={clsx(jobsCss.expander, v0.viewAllExpander, local.newsPreviewAll)}
        >
          {allCount ? `See all ${allCount} updates` : 'See all updates'}
        </a>
      </div>
    </section>
  );
}
