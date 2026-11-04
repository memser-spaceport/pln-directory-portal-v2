'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';

import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import sortCss from '@/components/common/filters/SortDropdown/SortDropdown.module.scss';

import {
  ALL_CAT,
  FOR_YOU_CAT,
  SHOW_POPULAR_THIS_WEEK,
  type TeamNewsCategoryId,
  TOP_STORIES_WINDOW_LABEL,
} from './constants';
import { SORT_OPTIONS } from './utils/sortTeamNewsClusters';
import { isOwnForumPost } from './utils/isOwnForumPost';
import { assertNever, feedEntryKey } from './utils/mergeFeedEntries';
import { useHomeFeed, type HomeFeedProps } from './hooks/useHomeFeed';

import { NewsBase } from './components/NewsBase';
import { NewsRail } from './components/NewsRail';
import { NewsSearch } from './components/NewsSearch';
import { ForYouHint } from './components/ForYouHint/ForYouHint';
import { TeamNewsTabs } from './components/TeamNewsTabs';
import { NewsGroupCard } from './components/NewsGroupCard';
import { ForumPostCard } from './components/ForumPostCard';
import { AutoMarkNewsCommentNotification } from './AutoMarkNewsCommentNotification';
import { NewsDetailModal } from './components/NewsDetailModal';
import { HiringCard } from './components/HiringCard/HiringCard';
import { ForumPostModal } from './components/ForumPostModal/ForumPostModal';
import { TopStoriesBlock } from './components/TopStories';
import { PopularScroller } from './components/FeedScrollers/PopularScroller';
import { DealCardCompact } from './components/DealCardCompact/DealCardCompact';
import { FollowTeamsScroller } from './components/FeedScrollers/FollowTeamsScroller';

import s from './TeamNews.module.scss';

/**
 * The previous Home's feed layout: focus-area tabs, the filter bar, the Top stories band, team clusters and the news
 * rail. Its data and state live in `useHomeFeed`, which the new Home's `NetworkUpdates` shares (LAB-3125).
 */
export const TeamNews = (props: HomeFeedProps) => {
  const { initialDigestSettings = null } = props;
  const {
    allItems,
    forumPosts,
    newCount,
    searchOpen,
    setSearchOpen,
    query,
    handleSearch,
    handleFieldBlur,
    desktopFieldRef,
    filterBarRef,
    feedGroups,
    feedItems,
    activeTab,
    handleTab,
    categoriesWithCounts,
    categoryOptions,
    activeCategory,
    handleCategory,
    topicFilter,
    handleTagSelect,
    handleTagFilterClear,
    searchedItems,
    sort,
    handleSort,
    currentUser,
    topStories,
    followedTeamUids,
    handleFollowToggle,
    handleUpvoteToggle,
    handleTopStoryOpen,
    handleStoryOpen,
    recordVisible,
    isBelowDesktop,
    showSuggestionsModule,
    visibleSuggestions,
    isLoadingSuggestedTeams,
    railPopularItems,
    handlePopularItemClick,
    entries,
    visibleEntries,
    pageSize,
    expanded,
    handleToggleAll,
    scrollTarget,
    resolvePostLike,
    handleForumPostOpen,
    handleForumPostLikeToggle,
    analytics,
    activeNewsUid,
    activeNewsItem,
    closeNews,
    activeForumPost,
    closePost,
  } = useHomeFeed(props);

  // A forum-access member with zero news in the window still gets their posts
  // (they render alone once the posts query lands — accepted pop-in).
  if (isEmpty(allItems) && (forumPosts?.length ?? 0) === 0) {
    return (
      <NewsBase>
        <div className={s.empty}>No network news in the last 14 days yet. Check back soon.</div>
      </NewsBase>
    );
  }

  return (
    <NewsBase
      headerDetails={
        <div className={s.headerActions}>
          {newCount > 0 && <span className={s.unreadBadge}>{newCount} new</span>}
          <NewsSearch
            open={searchOpen}
            value={query}
            onOpen={() => setSearchOpen(true)}
            onChange={handleSearch}
            onBlur={handleFieldBlur}
            fieldRef={desktopFieldRef}
          />
        </div>
      }
    >
      {/* Mobile only: header has no room to expand inline, so the field lives
          here as a permanent full-width row. Hidden on desktop via CSS. */}
      <div className={s.mobileSearchRow}>
        <SearchInput value={query} onChange={handleSearch} placeholder="Search by news, teams…" />
      </div>

      <TeamNewsTabs groups={feedGroups} allItems={feedItems} activeTab={activeTab} onTabChange={handleTab} />

      <div className={s.filterBar} ref={filterBarRef}>
        <div className={s.catRow}>
          {categoriesWithCounts.map((c) => {
            const isActive = activeCategory === c.id;
            const isDisabled = c.count === 0 && c.id !== ALL_CAT && c.id !== FOR_YOU_CAT;
            return (
              <button
                key={c.id}
                type="button"
                className={clsx(s.cat, { [s.catActive]: isActive })}
                onClick={() => handleCategory(c.id)}
                disabled={isDisabled}
              >
                {c.label}
                {c.count > 0 && c.id !== ALL_CAT && <span>{c.count}</span>}
              </button>
            );
          })}
        </div>
        <div className={s.filterActions}>
          {/* The tag filter (LAB-3010), labeled like "Sort by:" on this row so it
              reads as the feed's filter rather than one more hashtag. */}
          {topicFilter && (
            <span className={s.topicScope}>
              <span className={sortCss.sortByLabel}>Filter:</span>
              <span className={s.topicChip}>
                <span className={s.topicChipLabel}>#{topicFilter}</span>
                <button
                  type="button"
                  className={s.topicChipClear}
                  aria-label={`Show all updates instead of just #${topicFilter}`}
                  onClick={handleTagFilterClear}
                >
                  <svg viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
              <span className={s.topicCount}>
                {searchedItems.length} {searchedItems.length === 1 ? 'update' : 'updates'}
              </span>
            </span>
          )}
          {/* Mobile only — `.catRow`'s pill row holds the category filter at
              every wider breakpoint (see TeamNews.module.scss `.catRow` /
              `.typeMobile`). Same SortDropdown "Sort by:" already uses, so the
              two read as one control family on a narrow screen. */}
          <span className={s.typeMobile}>
            <SortDropdown
              sortByLabel="Type:"
              options={categoryOptions}
              currentSort={activeCategory}
              onSortChange={(value) => handleCategory(value as TeamNewsCategoryId)}
            />
          </span>
          <SortDropdown sortByLabel="Sort by:" options={SORT_OPTIONS} currentSort={sort} onSortChange={handleSort} />
        </div>
      </div>

      <div className={s.layout}>
        {/* tabIndex={-1}: focus-restore fallback target when the modal closes and
            the originating row is gone (deep link to a folded story) — focus must
            land somewhere in the feed, never on <body>. */}
        <div className={s.main} data-news-feed-root tabIndex={-1}>
          {activeCategory === FOR_YOU_CAT && <ForYouHint memberUid={currentUser?.uid} />}
          {topStories?.lead && (
            <div className={s.topStories}>
              <TopStoriesBlock
                lead={topStories.lead}
                also={topStories.also}
                windowLabel={TOP_STORIES_WINDOW_LABEL}
                followedTeamUids={followedTeamUids}
                onFollowToggle={handleFollowToggle}
                onUpvoteToggle={handleUpvoteToggle}
                onStoryOpen={handleTopStoryOpen}
                onStoryVisible={recordVisible}
                onTagSelect={(tag) => handleTagSelect(tag, 'top-story')}
                activeTag={topicFilter || undefined}
              />
            </div>
          )}

          {/* The rail's two modules, lifted to just under the band at widths
              where the rail itself stacks below the whole feed. Rendered only
              here — NewsRail drops them at the same breakpoint, so exactly one
              instance of each is ever on screen. Kept in the rail's own order
              so the modules don't swap places between widths. */}
          {isBelowDesktop && (
            <div className={s.feedScrollers}>
              {showSuggestionsModule && (
                <FollowTeamsScroller
                  suggestions={visibleSuggestions}
                  followedTeamUids={followedTeamUids}
                  onFollowToggle={handleFollowToggle}
                />
              )}
              {SHOW_POPULAR_THIS_WEEK && (
                <PopularScroller items={railPopularItems} onPopularItemClick={handlePopularItemClick} />
              )}
            </div>
          )}

          {/* Suppressed when the band is showing: a window whose every story is
              in the band leaves the stream empty, and "No network news in this
              filter" directly under three stories reads as a bug. */}
          {entries.length === 0 ? (
            !topStories?.lead && (
              <div className={s.empty}>
                {topicFilter
                  ? query.trim()
                    ? `No updates match “${query.trim()}” in #${topicFilter}.`
                    : `No #${topicFilter} updates in this filter.`
                  : query.trim()
                    ? `No network news matches "${query.trim()}".`
                    : 'No network news in this filter.'}
              </div>
            )
          ) : (
            <>
              {/* The stream, marked so it can be addressed apart from the
                  top-stories band above it — which renders its own copies of
                  the same stories. */}
              <div className={s.feed} data-news-feed-list>
                {visibleEntries.map((entry, index) => {
                  // Composite key intentionally forces a remount on every tab/category
                  // change so each card's local state (expanded stories, open comment
                  // threads) resets — see rationale in
                  // docs/plans/2026-07-06-feat-team-news-grouped-by-team-plan.md.
                  // NOTE: any future CSS transition on .storyRow/.expander will not
                  // animate across a filter change, since this replaces the DOM node
                  // rather than updating it in place.
                  const key = `${activeTab}::${String(activeCategory)}::${topicFilter}::${feedEntryKey(entry)}`;
                  switch (entry.kind) {
                    case 'news':
                      return (
                        <NewsGroupCard
                          key={key}
                          cluster={entry.cluster}
                          onStoryOpen={handleStoryOpen}
                          isFollowing={followedTeamUids.has(entry.cluster.teamUid)}
                          onFollowToggle={handleFollowToggle}
                          onUpvoteToggle={handleUpvoteToggle}
                          autoExpandStoryUid={
                            scrollTarget?.teamUid === entry.cluster.teamUid ? scrollTarget.storyUid : undefined
                          }
                          onStoryVisible={recordVisible}
                          onTagSelect={(tag) => handleTagSelect(tag, 'card')}
                          activeTag={topicFilter || undefined}
                        />
                      );
                    case 'forum':
                      return (
                        <ForumPostCard
                          key={key}
                          // Live like state resolved at render only — the merge
                          // above ranked by frozen counts, so likes never reorder
                          // the feed.
                          post={resolvePostLike(entry.post)}
                          position={index}
                          isOwnPost={isOwnForumPost(entry.post, currentUser?.uid)}
                          onOpenDetail={handleForumPostOpen}
                          onLikeToggle={handleForumPostLikeToggle}
                        />
                      );
                    case 'hiring':
                      // No flag check here: with the injection gated above, a
                      // hiring entry only exists when it is meant to be seen.
                      // Re-checking would reintroduce the invisible-entry bug
                      // the moment the two guards disagreed.
                      return (
                        <HiringCard
                          key={key}
                          group={entry.group}
                          isFollowing={followedTeamUids.has(entry.group.team.uid)}
                          position={index}
                          onFollowToggle={handleFollowToggle}
                          onRoleClick={(group, role, rolePosition) =>
                            analytics.onFeedHiringRoleClicked(group, role, rolePosition, index)
                          }
                          onViewAllClick={(group) => analytics.onFeedHiringViewAllClicked(group, index)}
                        />
                      );
                    case 'deal':
                      return (
                        <DealCardCompact
                          key={key}
                          deal={entry.deal}
                          onClick={(deal) => analytics.onFeedDealClicked(deal, index)}
                        />
                      );
                    default:
                      return assertNever(entry);
                  }
                })}
              </div>
              {entries.length > pageSize && (
                <div className={s.showAll}>
                  <Button style="border" variant="secondary" type="button" onClick={handleToggleAll}>
                    {expanded ? 'Show Less' : 'Show All'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <NewsRail
          initialDigestSettings={initialDigestSettings}
          popularItems={railPopularItems}
          isLoadingSuggestedTeams={isLoadingSuggestedTeams}
          visibleSuggestions={visibleSuggestions}
          renderModules={!isBelowDesktop}
          followedTeamUids={followedTeamUids}
          onFollowToggle={handleFollowToggle}
          onPopularItemClick={handlePopularItemClick}
        />
      </div>

      {/* Conditional mount, no isOpen half-state: the item prop is always the
          live overlay-merged object. Trades away the exit animation (accepted). */}
      <AutoMarkNewsCommentNotification newsItemUid={activeNewsUid} />
      {activeNewsItem && (
        <NewsDetailModal
          item={activeNewsItem}
          onClose={closeNews}
          onUpvoteToggle={(item) => handleUpvoteToggle(item, 'news-modal')}
          isFollowing={followedTeamUids.has(activeNewsItem.teamUid)}
          onFollowToggle={handleFollowToggle}
          // Constructed, not left to the body's current-URL fallback: the ?news=
          // param is written with raw history.replaceState, so the round-trip
          // has to name the story explicitly to survive a sign-in.
          loginHref={`/home?news=${encodeURIComponent(activeNewsItem.uid)}#login`}
          onTagSelect={(tag) => handleTagSelect(tag, 'modal')}
          activeTag={topicFilter || undefined}
        />
      )}
      {activeForumPost && (
        <ForumPostModal
          onClose={closePost}
          post={activeForumPost}
          isOwnPost={isOwnForumPost(activeForumPost, currentUser?.uid)}
          onLikeToggle={(post) => handleForumPostLikeToggle(post, 'news-modal')}
        />
      )}
    </NewsBase>
  );
};
