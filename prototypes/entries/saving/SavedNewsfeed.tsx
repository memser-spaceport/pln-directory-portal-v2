'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useMemo, useState, type PropsWithChildren, type ReactNode } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import {
  DISCUSSIONS_CAT,
  DISCUSSIONS_CATEGORY,
  ALL_TAB,
  ALL_CAT,
  FOR_YOU_CAT,
  FOR_YOU_CATEGORY,
} from '@/components/page/home/TeamNews/constants';
import { hasExistingDiscussion } from '@/components/page/home/TeamNews/utils/hasExistingDiscussion';
import { dedupeByUid } from '@/components/page/home/TeamNews/utils/dedupeByUid';
import { sortAllTabItemsByEventDate } from '@/components/page/home/TeamNews/utils/sortAllTabItemsByEventDate';
// Production shells, 1:1 — the same three imports newsfeed-v0 makes.
import nb from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';
import s from '@/components/page/home/TeamNews/TeamNews.module.scss';
import styles from '@/app/home/page.module.css';

import { NewsTabs } from '../newsfeed-v0/NewsTabs';
import { V0FeedCard } from '../newsfeed-v0/V0FeedCard';
import { ForumPostCard } from '../newsfeed-v0/ForumPostCard';
import type { TeamCluster } from '../newsfeed-v0/V0NewsCard';
import { FeedRail } from '../newsfeed-v0/FeedRail';
import { QuickActionsMock } from '../newsfeed-v0/QuickActionsMock';
import { MobileQuickActions } from '../newsfeed-v0/MobileQuickActions';
import { MobileFeedSort } from '../newsfeed-v0/MobileFeedSort';
import { SaveButton } from '../newsfeed-v0/FeedActions';
import { EVENT_TYPE_LABEL, EVENT_TYPE_HEX } from '../newsfeed-v0/eventMeta';
import {
  MOCK_GROUPS,
  FORUM_POSTS,
  BASE_LIKES,
  viewsFor,
  COMMENTS_BY_UID,
  SOURCES_BY_UID,
  MODAL_EXTRA_BY_UID,
  MODAL_CITED_BODY_BY_UID,
  VIDEO_BY_UID,
  PL_TEAM_UID,
  type ForumPost,
  type FeedComment,
} from '../newsfeed-v0/mocks';
import { FeedDetailModal, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import { ForumPostModal } from '../newsfeed-v0/ForumPostModal';
import type { FeedSort } from '../newsfeed-v0/feedView';
import local from '../newsfeed-v0/NewsfeedV0.module.scss';
// The board's text-button-in-a-sentence, for the empty state's way out.
import jb from '../job-board/JobBoardPrototype.module.scss';

import type { SavedItemsApi, SavedKind } from '../save-shared/savedItems';

interface Props {
  saved: SavedItemsApi;
  /** A story or post was just saved. Hands the shell a way into this
   *  surface's Saved tab, for the toast's link. */
  onSaved: (jumpToSaved: () => void) => void;
}

const groups = MOCK_GROUPS;
const PAGE_SIZE = 6;

/** The saved scope, as a pill id. */
const SAVED_CAT = 'saved';

/**
 * The teams For You matches, mocked — the `newsfeed` entry's set
 * (`FOR_YOU_TEAM_UIDS`), minus the one team this entry's mocks don't carry.
 * Protocol Labs stays out for the same reason it does there: it carries five
 * stories, and a pill that is most of the feed stops meaning anything.
 */
const FOR_YOU_TEAM_UIDS: readonly string[] = ['libp2p', 'drand', 'lattice-compute'];

type PillId =
  | typeof FOR_YOU_CAT
  | typeof SAVED_CAT
  | typeof ALL_CAT
  | 'FUNDING'
  | 'LAUNCH'
  | typeof DISCUSSIONS_CAT
  | 'HIRING';

/**
 * The pill row, in order: For You · Saved · All · Funding · Launch ·
 * Discussions · Hiring. The two personal reads lead (For You is production's
 * first pill and the resting one), then the whole feed, then the kinds of
 * story. Saved lives here rather than as a focus-area tab, so it can be read
 * inside any focus area. The other event types are not offered.
 */
const PILLS: Array<{ id: PillId; label: string }> = [
  FOR_YOU_CATEGORY,
  { id: SAVED_CAT, label: 'Saved' },
  { id: ALL_CAT, label: 'All' },
  { id: 'FUNDING', label: 'Funding' },
  { id: 'LAUNCH', label: 'Launch' },
  DISCUSSIONS_CATEGORY,
  { id: 'HIRING', label: 'Hiring' },
];

const SORT_OPTIONS = [
  { value: 'following', label: 'Following' },
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most popular' },
] as const;

const EVENT_TYPE_WEIGHT: Record<ITeamNewsItem['eventType'], number> = {
  FUNDING: 5,
  LAUNCH: 4,
  PARTNERSHIP: 3,
  MILESTONE: 2,
  ANNOUNCEMENT: 1,
  OTHER: 0,
  HIRING: 0,
  DEALS: 0,
};

function pickLead(items: ITeamNewsItem[]): ITeamNewsItem {
  let lead = items[0];
  let best = -1;
  for (const item of items) {
    const score = EVENT_TYPE_WEIGHT[item.eventType] * 2 + Math.min(item.discussion.count, 5);
    if (score > best) {
      best = score;
      lead = item;
    }
  }
  return lead;
}

function clusterByTeam(items: ITeamNewsItem[]): TeamCluster[] {
  const byTeam = new Map<string, ITeamNewsItem[]>();
  for (const item of items) {
    const existing = byTeam.get(item.teamUid);
    if (existing) existing.push(item);
    else byTeam.set(item.teamUid, [item]);
  }
  return Array.from(byTeam.values()).map((teamItems) => {
    const lead = pickLead(teamItems);
    return {
      teamUid: lead.teamUid,
      teamName: lead.teamName,
      teamLogoUrl: lead.teamLogoUrl,
      lead,
      rest: teamItems.filter((i) => i.uid !== lead.uid),
      isLeadNewest: lead.uid === teamItems[0].uid,
    };
  });
}

type FeedEntry = { kind: 'news'; cluster: TeamCluster } | { kind: 'forum'; post: ForumPost };

function NetworkUpdatesBase({ headerDetails, children }: PropsWithChildren<{ headerDetails?: ReactNode }>) {
  return (
    <section className={nb.section}>
      <div className={nb.header}>
        <h2 className={clsx(nb.title, local.sectionTitle)}>Network Updates</h2>
        {headerDetails}
      </div>
      <p className={nb.sub}>Recent shipping, raises, partnerships, and milestones from across the network.</p>
      {children}
    </section>
  );
}

/**
 * COPY-SIMPLIFY of `newsfeed-v0/NewsfeedV0Prototype`: the same shell, tabs,
 * pills, sort, cards, rail and detail modals, with the review switches
 * (comments version, personalization), the search field and the saved
 * *filter* left out — a saved filter and a saved item are two different
 * things wearing one word, and this entry is about the second. What is added
 * is one thing, in three places:
 *
 *  - **a bookmark at the end of every card's action row** (`SaveButton`, on
 *    stories and on forum posts alike — one list, one mark);
 *  - **a Saved pill** second in the pill row, after For You, counting what is kept;
 *  - **Save / Saved spelled out** in the story modal's footer beside Share,
 *    where there is room for the word.
 *
 * Saved is a pill, not a focus-area tab: it reads inside whichever focus area
 * is open, the sort keeps working, and the stories cluster by team exactly as
 * they do on All. Being a pill, it does not combine with Funding or Launch.
 * There is still no personal hub page; the list lives where the items live.
 */
export function SavedNewsfeed({ saved, onSaved }: Props) {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<PillId>(FOR_YOU_CAT);
  const [sort, setSort] = useState<FeedSort>('following');
  const [expanded, setExpanded] = useState(false);
  const [followedTeams, setFollowedTeams] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [commentsByUid, setCommentsByUid] = useState<Record<string, FeedComment[]>>(() => ({ ...COMMENTS_BY_UID }));
  const [detail, setDetail] = useState<FeedDetail | null>(null);
  const [forumDetail, setForumDetail] = useState<ForumPost | null>(null);

  const savedScope = activeCategory === SAVED_CAT;

  const toggleFollow = (teamUid: string) =>
    setFollowedTeams((prev) => {
      const next = new Set(prev);
      next.has(teamUid) ? next.delete(teamUid) : next.add(teamUid);
      return next;
    });

  const toggleLike = (uid: string) =>
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  const likeCount = (uid: string) => (BASE_LIKES[uid] ?? 0) + (likedIds.has(uid) ? 1 : 0);
  const isLiked = (uid: string) => likedIds.has(uid);
  const commentsFor = (uid: string) => commentsByUid[uid] ?? [];
  const addComment = (uid: string, text: string, parentUid?: string) =>
    setCommentsByUid((prev) => {
      const existing = prev[uid] ?? [];
      const comment: FeedComment = {
        uid: `c-${uid}-new-${existing.length + 1}`,
        author: 'You',
        role: 'Member @ Protocol Labs',
        text,
        createdAt: new Date().toISOString(),
        parentUid,
      };
      return { ...prev, [uid]: [...existing, comment] };
    });

  const handleTab = (id: string) => {
    setActiveTab(id);
    setActiveCategory(FOR_YOU_CAT);
    setExpanded(false);
  };
  const jumpToSaved = () => {
    setActiveTab(ALL_TAB);
    setActiveCategory(SAVED_CAT);
    setExpanded(false);
  };

  const toggleSave = (uid: string, kind: SavedKind) => {
    const nowSaved = saved.toggle(uid, kind);
    if (nowSaved) onSaved(jumpToSaved);
  };

  const openStoryDetail = (story: ITeamNewsItem, playVideo = false) =>
    setDetail({
      id: story.uid,
      kind: 'news',
      title: story.title,
      name: story.teamName,
      logoUrl: story.teamLogoUrl,
      kicker: EVENT_TYPE_LABEL[story.eventType],
      kickerColor: EVENT_TYPE_HEX[story.eventType],
      summary: story.summary
        ? story.summary + (MODAL_EXTRA_BY_UID[story.uid] ? `\n\n${MODAL_EXTRA_BY_UID[story.uid]}` : '')
        : (MODAL_EXTRA_BY_UID[story.uid] ?? null),
      time: story.eventDate,
      views: viewsFor(story.uid),
      sources: SOURCES_BY_UID[story.uid],
      citedBody: MODAL_CITED_BODY_BY_UID[story.uid],
      video: VIDEO_BY_UID[story.uid],
      autoplayVideo: playVideo,
      isProtocolLabs: story.teamUid === PL_TEAM_UID,
      readUrl: story.sourceUrl ?? undefined,
    });

  const allItems = useMemo(() => sortAllTabItemsByEventDate(dedupeByUid(groups.flatMap((g) => g.items))), []);

  const itemsForActiveTab = useMemo(() => {
    if (activeTab === ALL_TAB) return allItems;
    const group = groups.find((g) => g.focusArea.title === activeTab);
    return group?.items ?? [];
  }, [activeTab, allItems]);

  const postsForActiveTab = useMemo(
    () => (activeTab === ALL_TAB ? FORUM_POSTS : FORUM_POSTS.filter((p) => p.focusArea === activeTab)),
    [activeTab],
  );

  /* Saved and For You are slices of the focus area's list like any other pill:
     kept (or matched) stories, still newest-first, still clustered by team. */
  const newsForPill = (id: PillId) => {
    if (id === ALL_CAT) return itemsForActiveTab;
    if (id === FOR_YOU_CAT) return itemsForActiveTab.filter((i) => FOR_YOU_TEAM_UIDS.includes(i.teamUid));
    if (id === SAVED_CAT) return itemsForActiveTab.filter((i) => saved.isSaved(i.uid));
    if (id === DISCUSSIONS_CAT) return itemsForActiveTab.filter((i) => hasExistingDiscussion(i.discussion));
    return itemsForActiveTab.filter((i) => i.eventType === id);
  };
  /* Forum posts ride the three whole-feed reads; the story-kind pills drop them. */
  const postsForPill = (id: PillId) => {
    if (id === ALL_CAT || id === FOR_YOU_CAT) return postsForActiveTab;
    if (id === SAVED_CAT) return postsForActiveTab.filter((p) => saved.isSaved(p.uid));
    return [];
  };

  const categoriesWithCounts = PILLS.map((c) => ({
    ...c,
    count: c.id === ALL_CAT ? 0 : newsForPill(c.id).length + postsForPill(c.id).length,
  }));

  const filteredItems = newsForPill(activeCategory);

  const clusters = useMemo(() => clusterByTeam(filteredItems), [filteredItems]);

  const forumPosts = postsForPill(activeCategory);

  const entries = useMemo<FeedEntry[]>(() => {
    const clusterDate = (c: TeamCluster) =>
      Math.max(...[c.lead, ...c.rest].map((i) => new Date(i.eventDate).getTime()));
    const clusterLikes = (c: TeamCluster) => Math.max(...[c.lead, ...c.rest].map((i) => likeCount(i.uid)));
    const dateOf = (e: FeedEntry) =>
      e.kind === 'news' ? clusterDate(e.cluster) : new Date(e.post.createdAt).getTime();
    const likesOf = (e: FeedEntry) => (e.kind === 'news' ? clusterLikes(e.cluster) : likeCount(e.post.uid));
    const followedOf = (e: FeedEntry) => (e.kind === 'news' && followedTeams.has(e.cluster.teamUid) ? 1 : 0);

    const list: FeedEntry[] = [
      ...clusters.map((cluster) => ({ kind: 'news' as const, cluster })),
      ...forumPosts.map((post) => ({ kind: 'forum' as const, post })),
    ];
    const sorted = list.sort((a, b) => {
      if (sort === 'popular' && likesOf(b) !== likesOf(a)) return likesOf(b) - likesOf(a);
      if (sort === 'following' && followedOf(b) !== followedOf(a)) return followedOf(b) - followedOf(a);
      return dateOf(b) - dateOf(a);
    });
    const firstNews = sorted.find((e) => e.kind === 'news');
    const firstForum = sorted.find((e) => e.kind === 'forum');
    if (firstNews && firstForum)
      return [firstNews, firstForum, ...sorted.filter((e) => e !== firstNews && e !== firstForum)];
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusters, forumPosts, sort, followedTeams, likedIds]);

  const visibleEntries = expanded ? entries : entries.slice(0, PAGE_SIZE);
  const newCount = allItems.length + FORUM_POSTS.length;
  const savedCount = saved.countOf(['news', 'forum']);

  return (
    <div className={clsx(local.page, styles.home)}>
      <div className={styles.home__cn}>
        <div className={local.qaDesktop}>
          <QuickActionsMock />
        </div>
        <div className={local.qaMobile}>
          <MobileQuickActions />
        </div>

        <div className={styles.home__cn__teamnews}>
          {isEmpty(allItems) ? (
            <NetworkUpdatesBase>
              <div className={s.empty}>No network news in the last 14 days yet. Check back soon.</div>
            </NetworkUpdatesBase>
          ) : (
            <NetworkUpdatesBase
              headerDetails={
                <div className={clsx(local.headerActions, local.headerActionsBanner)}>
                  {newCount > 0 && <span className={s.unreadBadge}>{newCount} new</span>}
                </div>
              }
            >
              <div className={clsx(local.tabsConstrain, local.tabsConstrainBanner)}>
                <NewsTabs
                  groups={groups}
                  allItems={allItems}
                  activeTab={activeTab}
                  onTabChange={handleTab}
                />
              </div>

              <div className={local.filterBar}>
                <div className={s.catRow}>
                  {categoriesWithCounts.map((c) => {
                    const isActive = activeCategory === c.id;
                    const isDisabled = c.count === 0 && c.id !== ALL_CAT && c.id !== SAVED_CAT;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={clsx(s.cat, { [s.catActive]: isActive })}
                        onClick={() => {
                          setActiveCategory(c.id);
                          setExpanded(false);
                        }}
                        disabled={isDisabled}
                      >
                        {c.label}
                        {c.count > 0 && <span>{c.count}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className={local.filterActions}>
                  <span className={local.sortDesktop}>
                    <SortDropdown
                      sortByLabel="Sort by:"
                      options={SORT_OPTIONS}
                      currentSort={sort}
                      onSortChange={(v) => setSort(v as FeedSort)}
                    />
                  </span>
                  <span className={local.sortMobile}>
                    <MobileFeedSort
                      options={SORT_OPTIONS}
                      currentSort={sort}
                      onSortChange={(v) => setSort(v as FeedSort)}
                    />
                  </span>
                </div>
              </div>

              {entries.length === 0 ? (
                <div className={s.empty}>
                  {/* Two reasons to be here. Empty Saved says what the tab holds
                      and points back at the feed; a narrowed feed is just narrowed. */}
                  {savedScope && savedCount === 0 ? (
                    <>
                      You haven&apos;t saved any updates yet. Updates you bookmark collect here, so you can come back to
                      them.{' '}
                      <button type="button" className={jb.emptyLink} onClick={() => setActiveCategory(ALL_CAT)}>
                        Browse all updates
                      </button>
                    </>
                  ) : (
                    'No updates in this filter.'
                  )}
                </div>
              ) : (
                <>
                  <div className={clsx(local.feedLayout, local.feedLayoutBanner)}>
                    <div className={local.feedList}>
                      {visibleEntries.map((entry) =>
                        entry.kind === 'news' ? (
                          <V0FeedCard
                            key={`news-${entry.cluster.teamUid}`}
                            cluster={entry.cluster}
                            following={followedTeams.has(entry.cluster.teamUid)}
                            onToggleFollow={() => toggleFollow(entry.cluster.teamUid)}
                            showComments={false}
                            likeCount={likeCount}
                            isLiked={isLiked}
                            onToggleLike={toggleLike}
                            commentsFor={commentsFor}
                            onAddComment={addComment}
                            onOpenStory={openStoryDetail}
                            isSaved={saved.isSaved}
                            onToggleSave={(uid) => toggleSave(uid, 'news')}
                          />
                        ) : (
                          <ForumPostCard
                            key={`forum-${entry.post.uid}`}
                            post={entry.post}
                            showComments={false}
                            likeCount={likeCount(entry.post.uid)}
                            liked={isLiked(entry.post.uid)}
                            onToggleLike={() => toggleLike(entry.post.uid)}
                            comments={commentsFor(entry.post.uid)}
                            onAddComment={(text, parentUid) => addComment(entry.post.uid, text, parentUid)}
                            isCommentLiked={isLiked}
                            onToggleCommentLike={toggleLike}
                            onOpenDetail={() => setForumDetail(entry.post)}
                            saved={saved.isSaved(entry.post.uid)}
                            onToggleSave={() => toggleSave(entry.post.uid, 'forum')}
                          />
                        ),
                      )}
                    </div>
                    <aside className={local.feedRail}>
                      <FeedRail
                        followedTeams={followedTeams}
                        onToggleFollow={(teamUid) => toggleFollow(teamUid)}
                        allItems={allItems}
                      />
                    </aside>
                  </div>
                  {entries.length > PAGE_SIZE && (
                    <div className={clsx(s.showAll, local.showAllConstrain)}>
                      <Button style="border" variant="secondary" type="button" onClick={() => setExpanded((v) => !v)}>
                        {expanded ? 'Show Less' : 'Show All'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </NetworkUpdatesBase>
          )}
        </div>
      </div>

      <FeedDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        likeCount={detail ? likeCount(detail.id) : 0}
        liked={detail ? isLiked(detail.id) : false}
        onToggleLike={() => detail && toggleLike(detail.id)}
        citationStyle="superscript"
        /* Beside Share, in the footer's outbound cluster, with the word — the
           modal has the room the card's meta row does not. */
        footerAction={
          detail ? (
            <SaveButton saved={saved.isSaved(detail.id)} onToggle={() => toggleSave(detail.id, 'news')} showLabel />
          ) : undefined
        }
      />

      <ForumPostModal
        post={forumDetail}
        onClose={() => setForumDetail(null)}
        likeCount={forumDetail ? likeCount(forumDetail.uid) : 0}
        liked={forumDetail ? isLiked(forumDetail.uid) : false}
        onToggleLike={() => forumDetail && toggleLike(forumDetail.uid)}
        comments={forumDetail ? commentsFor(forumDetail.uid) : []}
        onAddComment={(text, parentUid) => forumDetail && addComment(forumDetail.uid, text, parentUid)}
        isCommentLiked={isLiked}
        onToggleCommentLike={toggleLike}
      />
    </div>
  );
}
