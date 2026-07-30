import { feedEntryKey, mergeFeedEntries, type FeedEntry } from '@/components/page/home/TeamNews/utils/mergeFeedEntries';
import { filterFeedForumPosts, matchesFeedForumPost } from '@/components/page/home/TeamNews/utils/matchesFeedForumPost';
import { sortTeamNewsClusters, type TeamNewsSort } from '@/components/page/home/TeamNews/utils/sortTeamNewsClusters';
import { ALL_CAT, ALL_TAB } from '@/components/page/home/TeamNews/constants';
import type { ITeamNewsItem, TeamCluster } from '@/types/team-news.types';
import type { ForumPostUid, IFeedForumPost } from '@/types/feed.types';

function newsItem(uid: string, teamUid: string, eventDate: string, upvoteCount = 0): ITeamNewsItem {
  return {
    uid,
    teamUid,
    teamName: `Team ${teamUid}`,
    teamLogoUrl: null,
    eventType: 'FUNDING',
    eventDate,
    title: `Story ${uid}`,
    summary: null,
    sourceUrl: 'https://example.com',
    sourceDomain: null,
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: eventDate,
    discussion: { count: 0, latestTopicUrl: null },
    upvoteCount,
  };
}

function cluster(teamUid: string, items: ITeamNewsItem[]): TeamCluster {
  return { teamUid, teamName: `Team ${teamUid}`, teamLogoUrl: null, items };
}

function post(uid: string, likeCount: number, createdAt: string, focusAreas: string[] = ['Infra']): IFeedForumPost {
  return {
    uid: uid as ForumPostUid,
    tid: 1,
    mainPid: 10,
    title: `Post ${uid}`,
    body: 'Body text',
    author: { memberUid: 'm1', name: 'Mira Chen', avatarUrl: null, role: 'Founder @ Lattice' },
    focusAreas,
    category: 'Compute',
    createdAt,
    forumTopicUrl: null,
    commentCount: 0,
    likeCount,
    viewerHasLiked: false,
  };
}

const NO_FOLLOWS: ReadonlySet<string> = new Set();

const CLUSTERS = [
  cluster('t1', [newsItem('n1', 't1', '2026-07-20', 30)]),
  cluster('t2', [newsItem('n2', 't2', '2026-07-22', 20)]),
  cluster('t3', [newsItem('n3', 't3', '2026-07-24', 10)]),
];

function counts(items: ITeamNewsItem[]): ReadonlyMap<string, number> {
  return new Map(items.map((i) => [i.uid, i.upvoteCount ?? 0]));
}

const UPVOTES = counts(CLUSTERS.flatMap((c) => c.items));

function newsOrder(entries: FeedEntry[]): string[] {
  return entries.filter((e) => e.kind === 'news').map((e) => feedEntryKey(e));
}

describe('mergeFeedEntries', () => {
  it('returns news-only entries when posts are undefined (typed pop-in shape)', () => {
    const sorted = sortTeamNewsClusters(CLUSTERS, 'popular', NO_FOLLOWS, UPVOTES);
    const entries = mergeFeedEntries({
      sortedClusters: sorted,
      forumPosts: undefined,
      sort: 'popular',
      followedTeamUids: NO_FOLLOWS,
      upvoteCounts: UPVOTES,
    });
    expect(entries).toHaveLength(3);
    expect(entries.every((e) => e.kind === 'news')).toBe(true);
  });

  it.each<TeamNewsSort>(['popular', 'latest', 'following'])(
    'delegation property (%s): news order is byte-identical to sortTeamNewsClusters output',
    (sort) => {
      const sorted = sortTeamNewsClusters(CLUSTERS, sort, new Set(['t2']), UPVOTES);
      const entries = mergeFeedEntries({
        sortedClusters: sorted,
        forumPosts: [post('fp_a', 25, '2026-07-23'), post('fp_b', 5, '2026-07-19')],
        sort,
        followedTeamUids: new Set(['t2']),
        upvoteCounts: UPVOTES,
      });
      expect(newsOrder(entries)).toEqual(sorted.map((c) => `news:${c.teamUid}`));
    },
  );

  it('slot-2 rule: first news stays first, best forum post lands second', () => {
    const sorted = sortTeamNewsClusters(CLUSTERS, 'popular', NO_FOLLOWS, UPVOTES);
    const entries = mergeFeedEntries({
      sortedClusters: sorted,
      forumPosts: [post('fp_low', 1, '2026-07-01'), post('fp_high', 99, '2026-07-02')],
      sort: 'popular',
      followedTeamUids: NO_FOLLOWS,
      upvoteCounts: UPVOTES,
    });
    expect(entries[0].kind).toBe('news');
    expect(feedEntryKey(entries[1])).toBe('forum:fp_high');
  });

  it('popular: posts interleave by likeCount against the upvote snapshot', () => {
    const sorted = sortTeamNewsClusters(CLUSTERS, 'popular', NO_FOLLOWS, UPVOTES); // t1(30) t2(20) t3(10)
    const entries = mergeFeedEntries({
      sortedClusters: sorted,
      forumPosts: [post('fp_mid', 15, '2026-07-02')],
      sort: 'popular',
      followedTeamUids: NO_FOLLOWS,
      upvoteCounts: UPVOTES,
    });
    // Natural position of fp_mid (15 likes) is between t2 (20) and t3 (10) —
    // but the slot-2 rule promotes the only forum post to index 1.
    expect(entries.map(feedEntryKey)).toEqual(['news:t1', 'forum:fp_mid', 'news:t2', 'news:t3']);
  });

  it('popular: with the slot filled, remaining posts sit at their ranked positions', () => {
    const sorted = sortTeamNewsClusters(CLUSTERS, 'popular', NO_FOLLOWS, UPVOTES);
    const entries = mergeFeedEntries({
      sortedClusters: sorted,
      forumPosts: [post('fp_top', 99, '2026-07-02'), post('fp_mid', 15, '2026-07-01')],
      sort: 'popular',
      followedTeamUids: NO_FOLLOWS,
      upvoteCounts: UPVOTES,
    });
    // fp_top (99) is promoted to slot 2; fp_mid (15) stays between t2 and t3.
    expect(entries.map(feedEntryKey)).toEqual(['news:t1', 'forum:fp_top', 'news:t2', 'forum:fp_mid', 'news:t3']);
  });

  it('latest: posts rank by createdAt against the cluster max eventDate', () => {
    const sorted = sortTeamNewsClusters(CLUSTERS, 'latest', NO_FOLLOWS, UPVOTES); // t3(24th) t2(22nd) t1(20th)
    const entries = mergeFeedEntries({
      sortedClusters: sorted,
      forumPosts: [post('fp_new', 0, '2026-07-25'), post('fp_old', 0, '2026-07-21')],
      sort: 'latest',
      followedTeamUids: NO_FOLLOWS,
      upvoteCounts: UPVOTES,
    });
    // fp_new (25th) naturally leads, and as best-ranked post it also satisfies
    // slot 2 after t3; fp_old (21st) sits between t2 (22nd) and t1 (20th).
    expect(entries.map(feedEntryKey)).toEqual(['news:t3', 'forum:fp_new', 'news:t2', 'forum:fp_old', 'news:t1']);
  });

  it('following: posts never precede a followed cluster', () => {
    const followed: ReadonlySet<string> = new Set(['t3']);
    const sorted = sortTeamNewsClusters(CLUSTERS, 'following', followed, UPVOTES); // t3 first, then t1(30) t2(20)
    const entries = mergeFeedEntries({
      sortedClusters: sorted,
      forumPosts: [post('fp_huge', 999, '2026-07-25')],
      sort: 'following',
      followedTeamUids: followed,
      upvoteCounts: UPVOTES,
    });
    // Even with 999 likes the post can't outrank the followed t3 — it lands in
    // slot 2 only because slot 2 is INSIDE the unfollowed tail here.
    expect(entries.map(feedEntryKey)).toEqual(['news:t3', 'forum:fp_huge', 'news:t1', 'news:t2']);
  });

  it('news-empty feed still renders posts (a forum-access user with zero news)', () => {
    const entries = mergeFeedEntries({
      sortedClusters: [],
      forumPosts: [post('fp_a', 2, '2026-07-02'), post('fp_b', 9, '2026-07-01')],
      sort: 'popular',
      followedTeamUids: NO_FOLLOWS,
      upvoteCounts: new Map(),
    });
    expect(entries.map(feedEntryKey)).toEqual(['forum:fp_b', 'forum:fp_a']);
  });

  it('is deterministic and does not mutate its inputs', () => {
    const sorted = sortTeamNewsClusters(CLUSTERS, 'popular', NO_FOLLOWS, UPVOTES);
    const posts = [post('fp_a', 25, '2026-07-23'), post('fp_b', 5, '2026-07-19')];
    const args = {
      sortedClusters: sorted,
      forumPosts: posts,
      sort: 'popular' as const,
      followedTeamUids: NO_FOLLOWS,
      upvoteCounts: UPVOTES,
    };
    const first = mergeFeedEntries(args).map(feedEntryKey);
    expect(mergeFeedEntries(args).map(feedEntryKey)).toEqual(first);
    expect(posts.map((p) => p.uid)).toEqual(['fp_a', 'fp_b']); // input order untouched
  });
});

describe('filterFeedForumPosts / matchesFeedForumPost', () => {
  const POSTS = [
    post('fp_infra', 1, '2026-07-01', ['Infrastructure']),
    post('fp_net', 2, '2026-07-02', ['Networking']),
  ];

  it('returns nothing outside the All category pill (posts have no event type)', () => {
    expect(filterFeedForumPosts(POSTS, { tab: ALL_TAB, category: 'FUNDING', query: '' })).toEqual([]);
    expect(filterFeedForumPosts(POSTS, { tab: ALL_TAB, category: 'active-discussions', query: '' })).toEqual([]);
  });

  it('scopes to the focus-area tab, always including the All tab', () => {
    expect(filterFeedForumPosts(POSTS, { tab: ALL_TAB, category: ALL_CAT, query: '' })).toHaveLength(2);
    expect(filterFeedForumPosts(POSTS, { tab: 'Networking', category: ALL_CAT, query: '' }).map((p) => p.uid)).toEqual([
      'fp_net',
    ]);
    expect(filterFeedForumPosts(POSTS, { tab: 'Storage', category: ALL_CAT, query: '' })).toEqual([]);
  });

  it('matches search over author, title, body, and category', () => {
    expect(matchesFeedForumPost(POSTS[0], ALL_TAB, 'mira')).toBe(true); // author
    expect(matchesFeedForumPost(POSTS[0], ALL_TAB, 'post fp_infra')).toBe(true); // title
    expect(matchesFeedForumPost(POSTS[0], ALL_TAB, 'body text')).toBe(true); // body
    expect(matchesFeedForumPost(POSTS[0], ALL_TAB, 'compute')).toBe(true); // category
    expect(matchesFeedForumPost(POSTS[0], ALL_TAB, 'zebra')).toBe(false);
  });

  it('treats undefined posts as empty (pop-in not arrived)', () => {
    expect(filterFeedForumPosts(undefined, { tab: ALL_TAB, category: ALL_CAT, query: '' })).toEqual([]);
  });
});
