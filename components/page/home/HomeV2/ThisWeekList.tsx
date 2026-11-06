'use client';

import clsx from 'clsx';
import Link from 'next/link';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { Badge } from '@/components/common/Badge';
import { FollowButton } from '@/components/ui/FollowButton';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { EVENT_TYPE_LABEL } from '@/components/page/home/TeamNews/utils/getEventTypeConfig';
import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
// Production Job Board "View all N …" expander, as the roles list ends on it.
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';

import { CommentCount } from './CommentCount';
import { LikeButton } from './LikeButton';
import { ViewCount } from './ViewCount';
import s from './HomeV2.module.scss';

/**
 * "This week in the network" (prototype `NewsPreviewList`, home-v2/NewsPreviewList.tsx): one white card of flat news
 * rows, with "See all updates →" in the header and again as "See all N updates", the card's last row (LAB-3174, from
 * the 2026-11-05 review: the header link alone was easy to miss; the row matches the roles list's "See all N jobs"). Rows are production `NewsCard`'s flat variant (classes imported), with the mock's
 * changes: the time at the head row's end, and the event type as a brand Badge beside the source.
 *
 * Signed out, every press that needs an account (Follow, Like) is the sign-up ask; the row itself opens the story,
 * which anyone can read.
 */
export function ThisWeekList({
  stories,
  commentCounts,
  onOpen,
  onNeedsAccount,
  allHref,
  allCount,
  onSeeAll,
}: {
  stories: ITeamNewsItem[];
  /** Comment counts by story uid; a missing uid reads as 0. */
  commentCounts?: Record<string, number>;
  /** `position` is the row's place in the list, from 1. */
  onOpen: (story: ITeamNewsItem, position: number) => void;
  onNeedsAccount: () => void;
  /** "See all updates": the news-only page. */
  allHref: string;
  /** Stories on that page, for "See all N updates"; without it the row says "See all updates". */
  allCount?: number;
  onSeeAll?: () => void;
}) {
  return (
    <section className={s.newsPreview} aria-labelledby="home-news-title">
      <div className={s.sideHead}>
        <h2 id="home-news-title" className={s.sideTitle}>
          This week in the network
        </h2>
        <Link href={allHref} className={s.sideLink} onClick={onSeeAll}>
          See all updates
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
      <div className={s.newsPreviewList}>
        {stories.map((item, index) => (
          <div
            key={item.uid}
            role="button"
            aria-haspopup="dialog"
            tabIndex={0}
            data-story-uid={item.uid}
            className={clsx(nc.cardFlat, s.newsPreviewRow)}
            onClick={() => onOpen(item, index + 1)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(item, index + 1);
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
              <span className={clsx(nc.time, s.newsPreviewTime)}>{formatTimeAgo(item.eventDate)}</span>
            </div>
            <h3 className={nc.headline}>{item.title}</h3>
            {item.summary && <p className={nc.summary}>{item.summary}</p>}
            <div className={nc.metaLine}>
              <div className={nc.meta}>
                <Badge variant="brand" noBorder className={s.newsPreviewBadge}>
                  {EVENT_TYPE_LABEL[item.eventType]}
                </Badge>
                {item.sourceDomain && <span className={nc.time}>{item.sourceDomain}</span>}
              </div>
              <span className={nc.actions} onClick={(e) => e.stopPropagation()}>
                <ViewCount count={item.viewCount ?? 0} />
                <LikeButton count={item.upvoteCount ?? 0} liked={false} onToggle={onNeedsAccount} />
                <CommentCount count={commentCounts?.[item.uid] ?? 0} onClick={() => onOpen(item, index + 1)} />
              </span>
            </div>
          </div>
        ))}
        <Link href={allHref} className={clsx(jobsCss.expander, s.viewAllExpander, s.newsPreviewAll)} onClick={onSeeAll}>
          {allCount ? `See all ${allCount} ${allCount === 1 ? 'update' : 'updates'}` : 'See all updates'}
        </Link>
      </div>
    </section>
  );
}
