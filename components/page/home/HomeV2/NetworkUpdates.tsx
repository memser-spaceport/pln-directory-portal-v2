'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import sortCss from '@/components/common/filters/SortDropdown/SortDropdown.module.scss';
import { FollowButton } from '@/components/ui/FollowButton';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useSetNewsTags } from '@/services/members/hooks/useSetNewsTags';
import { useNewsTopicSlugs } from '@/services/team-news/hooks/useNewsTopicSlugs';
import { PAGE_ROUTES } from '@/utils/constants';
import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import { ALL_CAT, FOR_YOU_CAT, type TeamNewsCategoryId } from '@/components/page/home/TeamNews/constants';
import { AutoMarkNewsCommentNotification } from '@/components/page/home/TeamNews/AutoMarkNewsCommentNotification';
import { ForumPostCard } from '@/components/page/home/TeamNews/components/ForumPostCard';
import { ForumPostModal } from '@/components/page/home/TeamNews/components/ForumPostModal/ForumPostModal';
import { NewsCard } from '@/components/page/home/TeamNews/components/NewsCard';
import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { NewsSearch } from '@/components/page/home/TeamNews/components/NewsSearch';
import type { HomeFeed } from '@/components/page/home/TeamNews/hooks/useHomeFeed';
import { isOwnForumPost } from '@/components/page/home/TeamNews/utils/isOwnForumPost';
import { assertNever, feedEntryKey } from '@/components/page/home/TeamNews/utils/mergeFeedEntries';
import { isEditorialRank } from '@/components/page/home/TeamNews/utils/selectTopStories';
import { SORT_OPTIONS } from '@/components/page/home/TeamNews/utils/sortTeamNewsClusters';
// Production Home's filter bar (pill row, mobile "Type:", "Sort by:") and its description line, as the prototype.
import tn from '@/components/page/home/TeamNews/TeamNews.module.scss';
import nb from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';
// The Job Board "See all N …" expander: the same brand text every rail ends in.
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';

import { HOME_NEWS_VIEW_HREF } from './constants';
import { ArrowRightIcon } from './icons';
import { chipVocabulary, selectNarrowByTags } from './utils/narrowByTags';
import { computeStreamCut, STREAM_CUT_MIN_STACKED, STREAM_SIDE_BY_SIDE_QUERY, type StreamCut } from './utils/streamCut';
import s from './HomeV2.module.scss';

/**
 * The stream mounts at most this many cards. The cut keeps a few on screen beside the rail, and "See all news" leads
 * on; mounting the whole 14 days (each card with its own view tracking) only to clip it would cost the page for
 * nothing.
 */
export const STREAM_RENDER_MAX = 24;

/**
 * "Network Updates" on the signed-in Home (LAB-3125): the prototype's `WeekFeed` (homepage-redesign-v0) on the
 * production feed's state (`useHomeFeed`, stream layout). One stream of news and forum posts, each card in full, with
 * production Home's filter bar under the title. No tabs and no Top stories band: the top stories stay where they
 * stand, badged, and the Top pill lists them.
 *
 * The pill row is fixed (For You · All · Top · Discussions · Funding · Launch · Announcement); a pill with nothing
 * under it is hidden, and pressing the active pill again goes back to All. Tags stack: each `#tag` clicked joins the
 * scope row under the pills, and a story must carry every one. The stream is cut level with the rail's end, the last
 * card fading under "See all news".
 */
export function NetworkUpdates({
  feed,
  fillTo,
  forYouTags,
}: {
  feed: HomeFeed;
  /** The rail beside the stream: the cut lands where it ends. */
  fillTo: RefObject<HTMLElement | null>;
  /** The member's news tags as the page arrived with them (For You's), until their preferences load. */
  forYouTags?: string[];
}) {
  const {
    allItems,
    forumPosts,
    query,
    handleSearch,
    handleFieldBlur,
    searchOpen,
    setSearchOpen,
    desktopFieldRef,
    filterBarRef,
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
    currentUser,
    followedTeamUids,
    handleFollowToggle,
    handleUpvoteToggle,
    handleStoryOpen,
    recordVisible,
    resolvePostLike,
    handleForumPostOpen,
    handleForumPostLikeToggle,
    activeNewsUid,
    activeNewsItem,
    closeNews,
    activeForumPost,
    closePost,
  } = feed;
  const homeAnalytics = useHomeAnalytics();
  const topicSlugs = useNewsTopicSlugs();

  const pickCategory = (id: TeamNewsCategoryId) => handleCategory(activeCategory === id ? ALL_CAT : id);

  // "Narrow by": the commonest other tags on the stories in scope, in the cards' own tag vocabulary.
  const narrowBy = useMemo(
    () => selectNarrowByTags(feedItems, topicScope, (item) => chipVocabulary(item, topicSlugs, SHOW_NEWS_PREFERENCES)),
    [feedItems, topicScope, topicSlugs],
  );

  const renderedEntries = entries.slice(0, STREAM_RENDER_MAX);
  const trimmedQuery = query.trim();
  const isEmpty = allItems.length === 0 && (forumPosts?.length ?? 0) === 0;

  /* The cut follows the rail: as many full cards as end above the rail's bottom, then the next one fades out where the
     rail ends, so the stream reaches the band below instead of leaving a gap. Every card stays in the DOM at its
     natural height (clipped by the list), so the measurement holds when the rail grows or the filter changes. */
  const listRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<StreamCut>({ full: STREAM_CUT_MIN_STACKED });
  const visibleKey = renderedEntries.map(feedEntryKey).join(',');
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const rail = fillTo.current;
      const besideRail = Boolean(rail) && (window.matchMedia?.(STREAM_SIDE_BY_SIDE_QUERY).matches ?? false);
      const railBottom =
        rail && besideRail ? rail.getBoundingClientRect().bottom - list.getBoundingClientRect().top : null;
      const next = computeStreamCut(Array.from(list.children) as HTMLElement[], railBottom);
      // The list observes its own size, which the clip changes: only re-render on a real change.
      setFit((prev) => (prev.full === next.full && prev.clip === next.clip ? prev : next));
    };
    // A ResizeObserver reports each target once on observe, between layout and paint, so the first cut needs no
    // separate call.
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    if (fillTo.current) ro.observe(fillTo.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [fillTo, visibleKey]);
  const cut = renderedEntries.length > fit.full;

  return (
    <section className={s.weekFeed} aria-labelledby="home-week-title">
      <div className={s.sectionHead}>
        {/* Production Home's title size (NewsBase `.title`: 24px, 32/42 from 1024px, weight 500). */}
        <h2 id="home-week-title" className={nb.title}>
          Network Updates
        </h2>
        <span className={s.weekHeadActions}>
          {/* Production's header search (NewsSearch: the icon opens the field inline; desktop only). */}
          <NewsSearch
            open={searchOpen}
            value={query}
            onOpen={() => setSearchOpen(true)}
            onChange={handleSearch}
            onBlur={handleFieldBlur}
            fieldRef={desktopFieldRef}
          />
        </span>
      </div>
      {/* Production Home's line under its news title: NewsBase's copy and `.sub`. */}
      <p className={clsx(nb.sub, s.weekSub)}>
        Recent shipping, raises, partnerships, and milestones from across the network.
      </p>
      {/* Phones: production's permanent full-width field under the header. */}
      <div className={tn.mobileSearchRow}>
        <SearchInput value={query} onChange={handleSearch} placeholder="Search by news, teams…" />
      </div>

      <div className={clsx(tn.filterBar, s.weekFilterBar)} ref={filterBarRef}>
        <div className={tn.catRow}>
          {streamCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={clsx(tn.cat, c.id === ALL_CAT && s.catAll, { [tn.catActive]: activeCategory === c.id })}
              aria-pressed={activeCategory === c.id}
              // Pressing the active pill again clears it back to All.
              onClick={() => pickCategory(c.id)}
            >
              {c.label}
              {c.id !== ALL_CAT && <span>{c.count}</span>}
            </button>
          ))}
        </div>
        <div className={tn.filterActions}>
          <span className={tn.typeMobile}>
            <SortDropdown
              sortByLabel="Type:"
              options={streamCategories.map((c) => ({ value: c.id, label: c.label }))}
              currentSort={activeCategory}
              onSortChange={(value) => handleCategory(value as TeamNewsCategoryId)}
            />
          </span>
          <SortDropdown sortByLabel="Sort by:" options={SORT_OPTIONS} currentSort={sort} onSortChange={handleSort} />
        </div>
      </div>

      {/* The tag scope, on a row of its own under the pills: a chip with × per tag (a story must carry all of them),
          the count, Follow for a single tag (an intersection can't be followed) or Clear all from two, then the
          commonest other tags still in scope. */}
      {topicScope.length > 0 && (
        <div className={s.tagScope}>
          <span className={sortCss.sortByLabel}>Filter:</span>
          {topicScope.map((tag) => (
            <span key={tag} className={clsx(s.savedView, s.savedFilterChip, s.scopeChip)}>
              <span className={clsx(s.savedViewBody, s.scopeChipLabel)}>
                <strong>#{tag}</strong>
              </span>
              <button
                type="button"
                className={s.savedViewDelete}
                aria-label={`Stop filtering by #${tag}`}
                onClick={() => handleScopeTagRemove(tag)}
              >
                <svg viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
          <span className={s.topicCount}>
            {feedItems.length} {feedItems.length === 1 ? 'update' : 'updates'}
          </span>
          {topicScope.length === 1 ? (
            SHOW_NEWS_PREFERENCES && currentUser?.uid ? (
              <FollowTagButton tag={topicScope[0]} memberUid={currentUser.uid} initialTags={forYouTags} />
            ) : null
          ) : (
            <button type="button" className={s.inlineLink} onClick={handleScopeClear}>
              Clear all
            </button>
          )}
          {narrowBy.length > 0 && (
            <span className={s.tagSuggest}>
              <span className={s.tagSuggestLabel}>Narrow by</span>
              {narrowBy.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={s.tagAdd}
                  aria-label={`Also filter by #${tag}`}
                  onClick={() => handleScopeNarrow(tag)}
                >
                  + #{tag}
                </button>
              ))}
            </span>
          )}
        </div>
      )}

      {/* Production's ForYouHint, where production puts it (head of the stream, For You only), drawn as the
          prototype's caption: the view's name, what it is made of, and the door to tune it. */}
      {activeCategory === FOR_YOU_CAT && <ForYouCaption memberUid={currentUser?.uid} />}

      {/* The cut: full cards down to the rail's end, the next fading into the page under "See all news". Cards past the
          cut are inert, so the faded one can't be half-clicked. tabIndex={-1}: the dialogs' focus-restore fallback. */}
      <div
        ref={listRef}
        className={clsx(s.feedList, s.cutList, cut && s.cutListFaded)}
        style={cut ? { maxHeight: fit.clip } : undefined}
        data-news-feed-root
        tabIndex={-1}
      >
        {renderedEntries.map((entry, index) => {
          const cutAway = cut && index >= fit.full;
          // Remounts a card when the filter changes, so its own state (an open thread) resets, as on the previous Home.
          const key = `${String(activeCategory)}::${topicScope.join(',')}::${streamEntryKey(entry)}`;
          return (
            <div key={key} aria-hidden={cutAway || undefined} inert={cutAway || undefined}>
              {renderEntry(entry, index)}
            </div>
          );
        })}
      </div>

      {renderedEntries.length === 0 && (
        <p className={s.weekEmpty}>
          {isEmpty ? (
            'No network news in the last 14 days yet. Check back soon.'
          ) : trimmedQuery ? (
            <>
              No updates match “{trimmedQuery}”.{' '}
              <button type="button" className={s.inlineLink} onClick={() => handleSearch('')}>
                Clear search
              </button>
            </>
          ) : (
            'No network news in this filter.'
          )}
        </p>
      )}

      <Link
        href={HOME_NEWS_VIEW_HREF}
        className={clsx(jobsCss.expander, s.cutSeeAll, cut && s.cutSeeAllOnFade)}
        onClick={() => homeAnalytics.onSeeAllClicked({ section: 'news' })}
      >
        See all news
      </Link>

      <AutoMarkNewsCommentNotification newsItemUid={activeNewsUid} />
      {activeNewsItem && (
        <NewsDetailModal
          item={activeNewsItem}
          onClose={closeNews}
          onUpvoteToggle={(item) => handleUpvoteToggle(item, 'news-modal')}
          isFollowing={followedTeamUids.has(activeNewsItem.teamUid)}
          onFollowToggle={handleFollowToggle}
          loginHref={`/home?news=${encodeURIComponent(activeNewsItem.uid)}#login`}
          onTagSelect={(tag) => handleScopeTagToggle(tag, 'modal')}
          activeTag={topicScope}
          showImage
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
    </section>
  );

  function renderEntry(entry: HomeFeed['entries'][number], index: number) {
    switch (entry.kind) {
      case 'news': {
        const item = entry.cluster.items[0];
        return (
          <NewsCard
            variant="full"
            item={item}
            position={index}
            isFollowing={followedTeamUids.has(item.teamUid)}
            onFollowToggle={handleFollowToggle}
            onUpvoteToggle={handleUpvoteToggle}
            onOpenDetail={(story, via) => handleStoryOpen(story, via === 'comments' ? 'view-all-comments' : 'row')}
            onVisible={recordVisible}
            onTagSelect={(tag) => handleScopeTagToggle(tag, 'card')}
            activeTags={topicScope.length > 0 ? topicScope : undefined}
            isTopStory={isEditorialRank(item.editorialRank)}
          />
        );
      }
      case 'forum':
        return (
          <ForumPostCard
            // Live like state resolved at render only, so likes never reorder the stream.
            post={resolvePostLike(entry.post)}
            position={index}
            isOwnPost={isOwnForumPost(entry.post, currentUser?.uid)}
            onOpenDetail={handleForumPostOpen}
            onLikeToggle={handleForumPostLikeToggle}
          />
        );
      // The stream carries no roll-ups or deals; the rail has roles and deals.
      case 'hiring':
      case 'deal':
        return null;
      default:
        return assertNever(entry);
    }
  }
}

/** The stream's key: one card per story, so a team's stories don't share the grouped feed's per-team key. */
function streamEntryKey(entry: HomeFeed['entries'][number]): string {
  return entry.kind === 'news' ? `news:${entry.cluster.items[0]?.uid}` : feedEntryKey(entry);
}

/**
 * For You's caption: production `ForYouHint`'s copy and link, redrawn as the prototype's caption (the view's name in
 * bold, what it is made of, and the link at the row's end) instead of a grey box.
 */
function ForYouCaption({ memberUid }: { memberUid?: string }) {
  const { onTeamNewsForYouTuneClicked, onTeamNewsForYouUpdateProfileClicked } = useTeamNewsAnalytics();

  return (
    <p className={s.forYouCaption}>
      <span className={s.forYouText}>
        <strong className={s.forYouLabel}>For you</strong>
        <span className={s.forYouDot} aria-hidden>
          ·
        </span>
        Curated based on your profile, primary team attributes, and the teams you follow.
      </span>
      {memberUid &&
        (SHOW_NEWS_PREFERENCES ? (
          <Link
            href="/settings/news-preferences?from=feed"
            className={s.forYouLink}
            onClick={() => onTeamNewsForYouTuneClicked(memberUid)}
          >
            Update to make it more relevant
            <ArrowRightIcon />
          </Link>
        ) : (
          <Link
            href={`${PAGE_ROUTES.MEMBERS}/${memberUid}?backTo=${encodeURIComponent(PAGE_ROUTES.HOME)}`}
            className={s.forYouLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTeamNewsForYouUpdateProfileClicked(memberUid)}
          >
            Update your profile
            <ArrowRightIcon />
          </Link>
        ))}
    </p>
  );
}

/**
 * Follow on a single-tag scope: adds the tag to the member's News preferences tags, with the same update
 * `/settings/news-preferences` makes; Following takes it off again (the prototype's toggle). The button flips at once
 * and goes back if the save fails (the update itself says so).
 */
function FollowTagButton({ tag, memberUid, initialTags }: { tag: string; memberUid: string; initialTags?: string[] }) {
  const { data: preferences } = useGetMemberPreferences(memberUid);
  const setNewsTags = useSetNewsTags(memberUid);
  const [localTags, setLocalTags] = useState<string[] | null>(null);
  const savedTags = Array.isArray(preferences?.newsTags) ? preferences.newsTags : (initialTags ?? []);
  const tags = localTags ?? savedTags;
  const following = tags.includes(tag);

  const toggle = () => {
    const next = following ? tags.filter((t) => t !== tag) : [...tags, tag];
    setLocalTags(next);
    setNewsTags(next, { onError: () => setLocalTags(null) });
  };

  return <FollowButton following={following} onClick={toggle} name={`#${tag}`} size="compact" />;
}
