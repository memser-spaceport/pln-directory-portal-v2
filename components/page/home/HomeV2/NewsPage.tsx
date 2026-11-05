'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useMemo } from 'react';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { useNewsTopicSlugs } from '@/services/team-news/hooks/useNewsTopicSlugs';
import { PAGE_ROUTES } from '@/utils/constants';
import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import { AutoMarkNewsCommentNotification } from '@/components/page/home/TeamNews/AutoMarkNewsCommentNotification';
import { NewsCard } from '@/components/page/home/TeamNews/components/NewsCard';
import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { NewsSearch } from '@/components/page/home/TeamNews/components/NewsSearch';
import { useHomeFeed, type HomeFeedProps } from '@/components/page/home/TeamNews/hooks/useHomeFeed';
import { matchesTeamNewsQuery } from '@/components/page/home/TeamNews/utils/matchesTeamNewsQuery';
import tn from '@/components/page/home/TeamNews/TeamNews.module.scss';
import home from '@/app/home/page.module.css';

import { FeedFilterBar } from './FeedFilterBar';
import { TagScopeRow } from './TagScopeRow';
import { useHomeAuthDoors } from './useHomeAuthDoors';
import { chipVocabulary, selectNarrowByTags } from './utils/narrowByTags';
import s from './HomeV2.module.scss';

/** Held open, so it needs no open/close of its own (NewsSearch's icon state is the stream's). */
const noop = () => {};

/**
 * "See all news" (signed in) and "See all updates" (signed out) lead here, `/home?view=news` (LAB-3126): the network's
 * news only, no forum posts, in the prototype's grid (homepage-redesign-v0 `?view=news`, `NewsGrid.tsx` as Polina
 * changed it on 2026-11-04).
 *
 * - Head: "← Home", "Network news", the story count, and production's news search held open beside the title (on
 *   phones, the full-width field under the head).
 * - The stream's filter bar on the stream's state (`useHomeFeed`, news only): For You (when it has stories) · All · Top
 *   · Funding · Launch · Announcement with counts, Sort by. Tags stack in the scope row, as on the stream.
 * - The grid: 2 columns from 640px, 1 on phones. Each story is production's boxed `NewsCard` with its `#tag` links and
 *   its image on the card's floor.
 *
 * Signed out, Follow and Like are the sign-up ask; the card still opens the story.
 */
export function NewsPage({
  feed: feedProps,
  signedIn,
  unavailable = false,
}: {
  feed: HomeFeedProps;
  signedIn: boolean;
  /** The news call failed: say so, rather than claiming there is no news. */
  unavailable?: boolean;
}) {
  const analytics = useHomeAnalytics();
  const { signUp } = useHomeAuthDoors();
  const topicSlugs = useNewsTopicSlugs();
  const feed = useHomeFeed(feedProps, {
    layout: 'stream',
    newsOnly: true,
    onTagScopeChange: (tags, action) => analytics.onFeedTagScopeChanged({ tags, action }),
  });
  const {
    allItems,
    query,
    handleSearch,
    desktopFieldRef,
    streamCategories,
    activeCategory,
    handleCategory,
    sort,
    handleSort,
    topicScope,
    feedItems,
    handleScopeTagToggle,
    handleScopeTagRemove,
    handleScopeClear,
    handleScopeNarrow,
    entries,
    followedTeamUids,
    handleFollowToggle,
    handleUpvoteToggle,
    handleStoryOpen,
    recordVisible,
    activeNewsUid,
    activeNewsItem,
    closeNews,
  } = feed;

  const askForAccount = signedIn ? undefined : () => signUp('news');

  const narrowBy = useMemo(
    () => selectNarrowByTags(feedItems, topicScope, (item) => chipVocabulary(item, topicSlugs, SHOW_NEWS_PREFERENCES)),
    [feedItems, topicScope, topicSlugs],
  );

  // News only: the hook lists no forum posts here, and the stream has no roll-ups or deals.
  const stories = entries.flatMap((entry) => (entry.kind === 'news' ? entry.cluster.items.slice(0, 1) : []));
  const trimmedQuery = query.trim();
  // The scope row counts what the tags and the search leave, as the pills do here.
  const scopedCount = trimmedQuery
    ? feedItems.filter((item) => matchesTeamNewsQuery(item, trimmedQuery.toLowerCase())).length
    : feedItems.length;

  return (
    <div className={home.home}>
      <div className={clsx(home.home__cn, s.memberPage)}>
        <section className={s.newsPage} aria-labelledby="home-news-page-title">
          <Link href={PAGE_ROUTES.HOME} className={s.newsBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M13 8H3M7 4L3 8l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Home
          </Link>
          <div className={s.newsPageHeadRow}>
            <div className={s.newsPageHead}>
              <h1 id="home-news-page-title" className={s.newsPageTitle}>
                Network news
              </h1>
              <p className={s.newsPageSub}>
                {allItems.length} {allItems.length === 1 ? 'story' : 'stories'} from network teams
              </p>
            </div>
            {/* Held open: on the page for the whole window, finding a story is the main task. Hidden on phones. */}
            <NewsSearch
              open
              value={query}
              onOpen={noop}
              onChange={handleSearch}
              onBlur={noop}
              fieldRef={desktopFieldRef}
            />
          </div>
          {/* Phones: production's permanent full-width field under the head. */}
          <div className={tn.mobileSearchRow}>
            <SearchInput value={query} onChange={handleSearch} placeholder="Search by news, teams…" />
          </div>

          {allItems.length > 0 && (
            <FeedFilterBar
              categories={streamCategories}
              activeCategory={activeCategory}
              onCategory={handleCategory}
              sort={sort}
              onSort={handleSort}
            />
          )}

          {topicScope.length > 0 && (
            <TagScopeRow
              tags={topicScope}
              count={scopedCount}
              noun={['story', 'stories']}
              onRemove={handleScopeTagRemove}
              onClear={handleScopeClear}
              narrowBy={narrowBy}
              onNarrow={handleScopeNarrow}
            />
          )}

          {stories.length > 0 ? (
            <ul className={s.newsGrid} data-news-feed-root>
              {stories.map((item, index) => (
                // The filter is in the key, as on the stream: a card starts fresh when the filter changes.
                <li key={`${String(activeCategory)}::${topicScope.join(',')}::${item.uid}`}>
                  <NewsCard
                    item={item}
                    position={index}
                    stretch
                    showImage
                    isFollowing={followedTeamUids.has(item.teamUid)}
                    onFollowToggle={handleFollowToggle}
                    upvoteCount={item.upvoteCount ?? 0}
                    viewerHasUpvoted={Boolean(item.viewerHasUpvoted)}
                    onUpvoteToggle={handleUpvoteToggle}
                    onNeedsAccount={askForAccount}
                    onOpenDetail={(story, via) =>
                      handleStoryOpen(story, via === 'comments' ? 'view-all-comments' : 'row')
                    }
                    onVisible={recordVisible}
                    onTagSelect={(tag) => handleScopeTagToggle(tag, 'card')}
                    activeTags={topicScope.length > 0 ? topicScope : undefined}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.weekEmpty}>
              {unavailable ? (
                'Network news isn’t available right now. Try again in a few minutes.'
              ) : allItems.length === 0 ? (
                'No network news in the last 14 days yet. Check back soon.'
              ) : trimmedQuery ? (
                <>
                  No stories match “{trimmedQuery}”.{' '}
                  <button type="button" className={s.inlineLink} onClick={() => handleSearch('')}>
                    Clear search
                  </button>
                </>
              ) : (
                'No network news in this filter.'
              )}
            </p>
          )}

          <AutoMarkNewsCommentNotification newsItemUid={activeNewsUid} />
          {activeNewsItem &&
            (signedIn ? (
              <NewsDetailModal
                item={activeNewsItem}
                onClose={closeNews}
                onUpvoteToggle={(item) => handleUpvoteToggle(item, 'news-modal')}
                isFollowing={followedTeamUids.has(activeNewsItem.teamUid)}
                onFollowToggle={handleFollowToggle}
                onTagSelect={(tag) => handleScopeTagToggle(tag, 'modal')}
                activeTag={topicScope}
                showImage
              />
            ) : (
              <NewsDetailModal
                item={activeNewsItem}
                onClose={closeNews}
                // Signed out, the modal's Like asks the reader to sign up first, as on the signed-out Home.
                onUpvoteToggle={() => signUp('news')}
                source="home"
                showImage
              />
            ))}
        </section>
      </div>
    </div>
  );
}
