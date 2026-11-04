'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';

import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { FollowButton } from '@/components/ui/FollowButton';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { getEventTypeConfig } from '@/components/page/home/TeamNews/utils/getEventTypeConfig';
import { SORT_OPTIONS, type TeamNewsSort } from '@/components/page/home/TeamNews/utils/sortTeamNewsClusters';

import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import tn from '@/components/page/home/TeamNews/TeamNews.module.scss';
import sortCss from '@/components/common/filters/SortDropdown/SortDropdown.module.scss';
import { CommentCount, LikeButton, ViewCount } from '../newsfeed-v0/FeedActions';
import { TopicTags } from '../newsfeed-v0/TopicTags';
import { viewsFor } from '../newsfeed-v0/mocks';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import nf from '../newsfeed/Newsfeed.module.scss';
import { FOR_YOU_UIDS } from './mocks';
import local from './HomeV2Prototype.module.scss';

const ALL = 'all';
const FOR_YOU = 'forYou';
/** The trimmed chip row the week feed uses, minus Discussions: this page holds news only. */
const ROW: { id: string; label: string }[] = [
  { id: FOR_YOU, label: 'For You' },
  { id: ALL, label: 'All' },
  { id: 'FUNDING', label: 'Funding' },
  { id: 'LAUNCH', label: 'Launch' },
  { id: 'ANNOUNCEMENT', label: 'Announcement' },
];

/**
 * "See all news": a page of news only (no forum threads), in a 3-column grid
 * on desktop, 2 on tablet, 1 on phones. Each card is a transcription of
 * production `NewsCard`'s default (boxed) variant, the card production's Home
 * grid draws (`.card`, `.head`, `.headline`, `.summary` clamped to three lines,
 * `.metaLine` with the event dot + label, source and time; classes imported),
 * simplified: no store, analytics, share menu or source popover. Hashtags are
 * the feed's (TopicTags links, production's tag vocabulary) and scope the grid
 * the same way the week feed does.
 *
 * The filter bar is the week feed's: For You · All · Funding · Launch ·
 * Announcement with counts, empty chips hidden, the active chip resets on a
 * second press; Sort by on the right.
 */
export function NewsGrid({
  stories,
  likeCount,
  isLiked,
  commentCount,
  followedTeams,
  onOpen,
  onLike,
  onFollow,
  homeHref,
}: {
  stories: ITeamNewsItem[];
  likeCount: (uid: string) => number;
  isLiked: (uid: string) => boolean;
  commentCount: (uid: string) => number;
  followedTeams: Set<string>;
  onOpen: (story: ITeamNewsItem) => void;
  /** Signed out, these are the sign-up ask. */
  onLike: (uid: string) => void;
  onFollow: (teamUid: string) => void;
  homeHref: string;
}) {
  const [cat, setCat] = useState(ALL);
  const [sort, setSort] = useState<TeamNewsSort>('latest');
  /* Selected hashtags, stacked as on Home's feed: a story must carry all of them. */
  const [topics, setTopics] = useState<string[]>([]);
  const toggleTopic = (tag: string) =>
    setTopics((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const matches = (s: ITeamNewsItem, c: string) =>
    c === ALL || (c === FOR_YOU ? FOR_YOU_UIDS.includes(s.uid) : s.eventType === (c as TeamNewsEventType));
  const scoped = stories.filter((s) => topics.every((t) => s.tags.includes(t)));

  /* "Narrow by": the commonest other tags in scope that would actually narrow it. */
  const freq = new Map<string, number>();
  if (topics.length)
    scoped.forEach((s) => s.tags.forEach((t) => !topics.includes(t) && freq.set(t, (freq.get(t) ?? 0) + 1)));
  const relatedTags = Array.from(freq.entries())
    .filter(([, n]) => n < scoped.length)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t);

  const pills = useMemo(
    () =>
      ROW.map((p) => ({ ...p, count: scoped.filter((s) => matches(s, p.id)).length })).filter(
        (p) => p.id === ALL || p.count > 0,
      ),
    // `matches` is pure over its arguments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scoped],
  );
  const activeCat = pills.some((p) => p.id === cat) ? cat : ALL;

  const visible = scoped
    .filter((s) => matches(s, activeCat))
    .sort((a, b) => {
      if (sort === 'popular') return likeCount(b.uid) - likeCount(a.uid);
      if (sort === 'following') {
        const d = Number(!followedTeams.has(a.teamUid)) - Number(!followedTeams.has(b.teamUid));
        if (d) return d;
      }
      return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    });

  return (
    <section className={local.newsPage} aria-labelledby="home-news-page-title">
      <a href={homeHref} className={local.newsBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Home
      </a>
      <div className={local.newsPageHead}>
        <h1 id="home-news-page-title" className={local.newsPageTitle}>
          Network news
        </h1>
        <p className={local.newsPageSub}>{stories.length} stories from network teams</p>
      </div>

      <div className={tn.filterBar}>
        <div className={tn.catRow}>
          {pills.map((p) => (
            <button
              key={p.id}
              type="button"
              className={clsx(tn.cat, { [tn.catActive]: activeCat === p.id })}
              aria-pressed={activeCat === p.id}
              onClick={() => setCat(activeCat === p.id ? ALL : p.id)}
            >
              {p.label}
              {p.id !== ALL && <span>{p.count}</span>}
            </button>
          ))}
        </div>
        <div className={tn.filterActions}>
          <span className={tn.typeMobile}>
            <SortDropdown
              sortByLabel="Type:"
              options={pills.map((p) => ({ value: p.id, label: p.label }))}
              currentSort={activeCat}
              onSortChange={setCat}
            />
          </span>
          <SortDropdown
            sortByLabel="Sort by:"
            options={SORT_OPTIONS}
            currentSort={sort}
            onSortChange={(v) => setSort(v as TeamNewsSort)}
          />
        </div>
      </div>

      {/* Multi-tag scope: the same row as Home's feed (WeekFeed), without Follow. */}
      {topics.length > 0 && (
        <div className={local.tagScope}>
          <span className={sortCss.sortByLabel}>Filter:</span>
          {topics.map((t) => (
            <span key={t} className={clsx(v0.savedView, v0.savedFilterChip, nf.scopeChip)}>
              <span className={clsx(v0.savedViewBody, nf.scopeChipLabel)}>
                <strong>#{t}</strong>
              </span>
              <button
                type="button"
                className={v0.savedViewDelete}
                aria-label={`Stop filtering by #${t}`}
                onClick={() => toggleTopic(t)}
              >
                <svg viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
          <span className={nf.topicCount}>
            {scoped.length} {scoped.length === 1 ? 'story' : 'stories'}
          </span>
          {topics.length > 1 && (
            <button type="button" className={local.inlineLink} onClick={() => setTopics([])}>
              Clear all
            </button>
          )}
          {relatedTags.length > 0 && (
            <span className={local.tagSuggest}>
              <span className={local.tagSuggestLabel}>Narrow by</span>
              {relatedTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={local.tagAdd}
                  aria-label={`Also filter by #${t}`}
                  onClick={() => toggleTopic(t)}
                >
                  + #{t}
                </button>
              ))}
            </span>
          )}
        </div>
      )}

      <ul className={local.newsGrid}>
        {visible.map((item) => {
          const { label, dotClassName } = getEventTypeConfig(item.eventType);
          const following = followedTeams.has(item.teamUid);
          return (
            <li key={item.uid}>
              <div
                role="button"
                aria-haspopup="dialog"
                tabIndex={0}
                className={clsx(nc.card, local.newsGridCard)}
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
                    following={following}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFollow(item.teamUid);
                    }}
                    name={item.teamName}
                    size="compact"
                  />
                </div>
                <h3 className={clsx(nc.headline, local.newsGridHeadline)}>{item.title}</h3>
                {item.summary && <p className={clsx(nc.summary, local.newsGridSummary)}>{item.summary}</p>}
                <TopicTags
                  tags={item.tags}
                  onSelect={toggleTopic}
                  active={topics.length ? topics : undefined}
                />
                <div className={clsx(nc.metaLine, local.newsGridMeta)}>
                  <div className={nc.meta}>
                    <span className={nc.eventType}>
                      <span className={clsx(nc.eventDot, dotClassName)} aria-hidden="true" />
                      <span className={nc.eventLabel}>{label}</span>
                    </span>
                    <span className={nc.sep} aria-hidden="true" />
                    <span className={nc.time}>{formatTimeAgo(item.eventDate)}</span>
                  </div>
                  <span className={nc.actions} onClick={(e) => e.stopPropagation()}>
                    <ViewCount count={viewsFor(item.uid)} compact />
                    <LikeButton count={likeCount(item.uid)} liked={isLiked(item.uid)} onToggle={() => onLike(item.uid)} />
                    <CommentCount count={commentCount(item.uid)} onClick={() => onOpen(item)} />
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
