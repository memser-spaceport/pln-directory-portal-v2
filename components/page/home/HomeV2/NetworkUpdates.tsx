'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { Fragment, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { FollowButton } from '@/components/ui/FollowButton';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useSetNewsTags } from '@/services/members/hooks/useSetNewsTags';
import { useNewsTopicSlugs } from '@/services/team-news/hooks/useNewsTopicSlugs';
import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import { AutoMarkNewsCommentNotification } from '@/components/page/home/TeamNews/AutoMarkNewsCommentNotification';
import { ForumPostCard } from '@/components/page/home/TeamNews/components/ForumPostCard';
import { ForumPostModal } from '@/components/page/home/TeamNews/components/ForumPostModal/ForumPostModal';
import { NewsCard } from '@/components/page/home/TeamNews/components/NewsCard';
import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { NewsSearch } from '@/components/page/home/TeamNews/components/NewsSearch';
import type { HomeFeed } from '@/components/page/home/TeamNews/hooks/useHomeFeed';
import { isOwnForumPost } from '@/components/page/home/TeamNews/utils/isOwnForumPost';
import { assertNever, feedEntryKey } from '@/components/page/home/TeamNews/utils/mergeFeedEntries';
import { ALL_CAT, ALL_TAB } from '@/components/page/home/TeamNews/constants';
import {
  ForYouSetupPrompt,
  isForYouSetupEligible,
  isForYouSetupVisible,
} from '@/components/page/home/TeamNews/components/ForYouSetupPrompt/ForYouSetupPrompt';
import { isEditorialRank } from '@/components/page/home/TeamNews/utils/selectTopStories';
import { matchesTeamNewsQuery } from '@/components/page/home/TeamNews/utils/matchesTeamNewsQuery';
import { sortTeamNewsClusters } from '@/components/page/home/TeamNews/utils/sortTeamNewsClusters';
import type { ITeamNewsItem } from '@/types/team-news.types';
// Production Home's mobile search row and its description line, as the prototype.
import tn from '@/components/page/home/TeamNews/TeamNews.module.scss';
import nb from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';
// The Job Board "See all N …" expander: the same brand text every rail ends in.
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';

import { HOME_NEWS_VIEW_HREF } from './constants';
import { FeedFilterBar } from './FeedFilterBar';
import { chipVocabulary, selectNarrowByTags } from './utils/narrowByTags';
import { TagScopeRow } from './TagScopeRow';
import { useColumnCut } from './utils/useColumnCut';
import s from './HomeV2.module.scss';

/** The For You line's link (LAB-3174): News preferences, not general profile settings. */
const NEWS_PREFERENCES_HREF = '/settings/news-preferences';

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
 * card fading under "See all news". A filtered tab that ends above the rail keeps its stories first, then "Other news"
 * and the rest of All, so the column still meets the rail. All itself is not filled.
 */
export function NetworkUpdates({
  feed,
  fillTo,
  fillKey = '',
  forYouTags,
}: {
  feed: HomeFeed;
  /** The rail beside the stream: the cut lands where it ends. */
  fillTo: RefObject<HTMLElement | null>;
  /** Changes when the rail gains a section, so the cut is measured again after that render. */
  fillKey?: string;
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
    activeTab,
    hasNoNewsTags,
    hasForYouNews,
    followsAnyTeam,
    followsSettled,
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

  // "Narrow by": the commonest other tags on the stories in scope, in the cards' own tag vocabulary.
  const narrowBy = useMemo(
    () => selectNarrowByTags(feedItems, topicScope, (item) => chipVocabulary(item, topicSlugs, SHOW_NEWS_PREFERENCES)),
    [feedItems, topicScope, topicSlugs],
  );

  const ownEntries = entries.slice(0, STREAM_RENDER_MAX);
  const trimmedQuery = query.trim();
  const isEmpty = allItems.length === 0 && (forumPosts?.length ?? 0) === 0;
  // All, in the current sort, minus stories the tab already shows. Empty on All, and when the tab has nothing.
  const otherPool = useMemo(
    () =>
      activeCategory === ALL_CAT
        ? []
        : selectOtherNews(feedItems, newsUids(entries), trimmedQuery, sort, followedTeamUids),
    [activeCategory, feedItems, entries, trimmedQuery, sort, followedTeamUids],
  );
  const fillFromAll = activeCategory !== ALL_CAT && ownEntries.length > 0 && otherPool.length > 0;
  const tabKey = `${String(activeCategory)}|${topicScope.join(',')}|${trimmedQuery}|${sort}`;
  const [otherNewsFor, setOtherNewsFor] = useState<string | null>(null);
  const showOther = fillFromAll && otherNewsFor === tabKey && ownEntries.length < STREAM_RENDER_MAX;
  const renderedEntries = showOther
    ? [...ownEntries, ...otherPool.slice(0, STREAM_RENDER_MAX - ownEntries.length)]
    : ownEntries;

  /* The cut follows the rail: as many full cards as end above the rail's bottom, then the next one fades out where the
     rail ends. Measured again when the rail grows after this list (deals, teams, images). A filtered tab that stops
     short of the rail then mounts Other news and is measured again. */
  const listRef = useRef<HTMLDivElement>(null);
  const visibleKey = renderedEntries.map(feedEntryKey).join(',');
  const fit = useColumnCut(listRef, fillTo, `${visibleKey}|${fillKey}`, fillFromAll ? ownEntries.length : undefined);
  const cut = renderedEntries.length > fit.full;
  useLayoutEffect(() => {
    setOtherNewsFor(fillFromAll && !fit.reachesRef.current ? tabKey : null);
  }, [fillFromAll, fit.primaryReaches, fit.reachesRef, tabKey, fillKey, visibleKey]);

  const forYouSetupInput = {
    preferencesOn: SHOW_NEWS_PREFERENCES,
    signedIn: Boolean(currentUser?.uid),
    hasNoNewsTags,
    hasForYouNews,
    followsAnyTeam,
    followsSettled,
  };
  const showForYouSetup = isForYouSetupEligible(forYouSetupInput);
  // Holds the curated line back until follows load, so it does not flash for a member who follows nobody.
  const awaitingFollows =
    SHOW_NEWS_PREFERENCES && Boolean(currentUser?.uid) && hasNoNewsTags && !hasForYouNews && !followsSettled;

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

      <FeedFilterBar
        categories={streamCategories}
        activeCategory={activeCategory}
        onCategory={handleCategory}
        sort={sort}
        onSort={handleSort}
        barRef={filterBarRef}
        className={s.weekFilterBar}
      />

      {/* Follow for a single tag (an intersection can't be followed), Clear all from two. */}
      {topicScope.length > 0 && (
        <TagScopeRow
          tags={topicScope}
          count={feedItems.length}
          noun={['update', 'updates']}
          onRemove={handleScopeTagRemove}
          onClear={handleScopeClear}
          narrowBy={narrowBy}
          onNarrow={handleScopeNarrow}
          single={
            SHOW_NEWS_PREFERENCES && currentUser?.uid ? (
              <FollowTagButton tag={topicScope[0]} memberUid={currentUser.uid} initialTags={forYouTags} />
            ) : null
          }
        />
      )}

      {/* No For You stories, no tags and no follows: the set-up line on resting All (LAB-3080).
          Own teams do not hide it. Anyone else keeps the curated line (LAB-3174). */}
      {showForYouSetup ? (
        <ForYouSetupPrompt
          memberUid={currentUser?.uid}
          visible={isForYouSetupVisible({
            ...forYouSetupInput,
            activeTab,
            activeCategory,
            query,
            hasTopicFilter: topicScope.length > 0,
          })}
          className={s.forYouLine}
        />
      ) : awaitingFollows ? null : (
        <ForYouCaption memberUid={currentUser?.uid} />
      )}

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
          const card = (
            <div key={key} data-feed-card aria-hidden={cutAway || undefined} inert={cutAway || undefined}>
              {renderEntry(entry, index)}
            </div>
          );
          // The tab's own cards stay a block. Other news starts only after the last of them.
          if (showOther && index === ownEntries.length) {
            return (
              <Fragment key={`other-news-${key}`}>
                <p className={s.otherNews} data-feed-skip>
                  Other news
                </p>
                {card}
              </Fragment>
            );
          }
          return card;
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
 * The "For you" line (LAB-3174, prototype 2026-11-06): under the filter pills on every filter, on the plain page
 * ground, with "News preferences" as a brand text link right after the sentence. The link opens News preferences.
 */
function ForYouCaption({ memberUid }: { memberUid?: string }) {
  const { onTeamNewsForYouTuneClicked } = useTeamNewsAnalytics();

  return (
    <p className={clsx(s.personalizeText, s.forYouLine)}>
      <span className={s.personalizeLabel}>For you</span> · Curated from your profile, your team, and the teams you
      follow.{' '}
      <Link
        href={NEWS_PREFERENCES_HREF}
        className={s.forYouInlineLink}
        onClick={() => memberUid && onTeamNewsForYouTuneClicked(memberUid)}
      >
        News preferences
      </Link>
    </p>
  );
}

/** News uids already in the tab. Other news must not show them again. */
function newsUids(entries: HomeFeed['entries']): Set<string> {
  const uids = new Set<string>();
  for (const entry of entries) {
    if (entry.kind === 'news' && entry.cluster.items[0]) uids.add(entry.cluster.items[0].uid);
  }
  return uids;
}

/**
 * The All list under the current search and sort, without stories the active tab already shows.
 * `items` is All's order (latest). The sort puts it in the order All would use.
 */
function selectOtherNews(
  items: ITeamNewsItem[],
  shownUids: ReadonlySet<string>,
  query: string,
  sort: Parameters<typeof sortTeamNewsClusters>[1],
  followedTeamUids: ReadonlySet<string>,
): HomeFeed['entries'] {
  const q = query.trim().toLowerCase();
  const pool = items.filter((item) => !shownUids.has(item.uid) && (!q || matchesTeamNewsQuery(item, q)));
  const counts = new Map(pool.map((item) => [item.uid, item.upvoteCount ?? 0]));
  const clusters = pool.map((item) => ({
    teamUid: item.teamUid,
    teamName: item.teamName,
    teamLogoUrl: item.teamLogoUrl,
    items: [item],
  }));
  return sortTeamNewsClusters(clusters, sort, followedTeamUids, counts).map((cluster) => ({
    kind: 'news' as const,
    cluster,
  }));
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
