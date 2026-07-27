import type {
  ForumPostUid,
  ICreateFeedCommentRequest,
  IFeedAuthor,
  IFeedComment,
  IFeedCommentCountsResponse,
  IFeedCommentsResponse,
  IFeedForumPost,
  IFeedForumPostLikeStatus,
  IFeedForumPostsResponse,
} from '@/types/feed.types';
import { MOCK_FEED_FAIL_TOKEN } from './constants';
import { FeedForumPostsForbiddenError } from './feed.errors';

// Dev-only fixtures for the feed's social layer (forum posts + feed comments)
// while the real API doesn't exist. Enable via NEXT_PUBLIC_MOCK_FEED_SOCIAL=true
// — see feed.service.ts and .env.example. All people here are FICTIONAL (the
// fixtures ship in a world-readable client chunk — never put real members in).
// This module is only ever loaded through a dynamic import inside the mock
// branch, so its ~fixtures stay out of the main /home chunk.
//
// Deliberate boundary cases (exercised by tests and manual QA):
// - fp_shared-dht has 0 comments   → "Be the first to comment" state
// - fp_compute-pricing has exactly 2 → the visible-cap boundary
// - mock-pl-net-1 has 6            → "View all N comments"
// News-thread seeds are keyed to MOCK_TEAM_NEWS fixture uids, so they only
// light up when that flag is on too; against real news data, threads start
// empty (still fully functional — the store accepts writes for any uid).

function assertNotProduction(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('feed.mock-data must never run in production');
  }
}

const MOCK_LATENCY_MS = 300;

function delay(): Promise<void> {
  const ms = process.env.NODE_ENV === 'test' ? 0 : MOCK_LATENCY_MS;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const FICTIONAL_AUTHORS = {
  mira: {
    memberUid: 'mock-member-mira-chen',
    name: 'Mira Chen',
    avatarUrl: null,
    role: 'Founder @ Lattice Compute',
  },
  devon: {
    memberUid: 'mock-member-devon-okoro',
    name: 'Devon Okoro',
    avatarUrl: null,
    role: 'Protocol Engineer @ libp2p',
  },
  sasha: {
    memberUid: 'mock-member-sasha-rao',
    name: 'Sasha Rao',
    avatarUrl: null,
    role: 'Research Lead @ Filecoin Foundation',
  },
  priya: {
    memberUid: 'mock-member-priya-nair',
    name: 'Priya Nair',
    avatarUrl: null,
    role: 'Ecosystem Lead @ Protocol Labs',
  },
} satisfies Record<string, IFeedAuthor>;

const SEED_FORUM_POSTS = [
  {
    uid: 'fp_compute-pricing' as ForumPostUid,
    title: 'What pricing model actually works for verifiable GPU workloads?',
    body: 'We are weighing spot-style bidding against fixed per-proof pricing for the testnet. Spot keeps utilization high but makes cost unpredictable for buyers running long jobs. Curious how other compute teams landed on this — did you start fixed and move to a market, or the other way around?',
    author: FICTIONAL_AUTHORS.mira,
    focusAreas: ['Infrastructure'],
    category: 'Compute',
    createdAt: '2026-06-27T18:30:00.000Z',
    forumTopicUrl: null,
    commentCount: 0, // derived from the comment store at read time
    likeCount: 12,
    viewerHasLiked: false,
  },
  {
    uid: 'fp_shared-dht' as ForumPostUid,
    title: 'Shared DHT for rollup peer discovery — worth standardizing?',
    body: 'Following the L2 partnership, a few of us sketched a common peer-routing format so rollup nodes can share one DHT instead of each shipping their own. Before we write it up as a spec proposal: who else would adopt this, and what breaks for you if discovery becomes shared infrastructure?',
    author: FICTIONAL_AUTHORS.devon,
    focusAreas: ['Networking'],
    category: 'Networking',
    createdAt: '2026-06-21T09:15:00.000Z',
    forumTopicUrl: null,
    commentCount: 0,
    likeCount: 27,
    viewerHasLiked: false,
  },
  {
    uid: 'fp_ai-provenance' as ForumPostUid,
    title: 'Provenance metadata for AI training sets — what should be mandatory?',
    body: 'As the verifiable-storage grants round opens, we want the metadata schema to be strict enough to be useful but not so heavy nobody fills it in. Leaning toward: source license, collection date, and a content hash as required; everything else optional. What would you add or cut?',
    author: FICTIONAL_AUTHORS.sasha,
    focusAreas: ['Storage'],
    category: 'Storage',
    createdAt: '2026-06-25T14:45:00.000Z',
    forumTopicUrl: null,
    commentCount: 0,
    likeCount: 8,
    viewerHasLiked: false,
  },
  {
    uid: 'fp_onboarding-funnel' as ForumPostUid,
    title: 'Onboarding flow doubled contributor sign-ups — sharing what changed',
    body: 'Quick write-up for anyone rebuilding their onboarding: the biggest win was cutting the first-run steps from nine to four and moving grant discovery ahead of profile setup. Happy to share the before/after funnel numbers if useful.',
    author: FICTIONAL_AUTHORS.priya,
    focusAreas: ['Infrastructure'],
    category: 'Community',
    createdAt: '2026-06-19T11:20:00.000Z',
    forumTopicUrl: null,
    commentCount: 0,
    likeCount: 19,
    viewerHasLiked: false,
  },
] satisfies readonly IFeedForumPost[];

function comment(uid: string, itemUid: string, author: IFeedAuthor, text: string, createdAt: string): IFeedComment {
  return { uid, itemUid, author, text, createdAt };
}

const SEED_COMMENTS: readonly IFeedComment[] = [
  // mock-lc-1 — the Lattice Compute funding story in the MOCK_TEAM_NEWS fixture
  comment(
    'c-lc1-1',
    'mock-lc-1',
    FICTIONAL_AUTHORS.devon,
    'Congrats! Is the GPU marketplace going to be permissionless from day one, or gated for the testnet?',
    '2026-06-26T15:10:00.000Z',
  ),
  comment(
    'c-lc1-2',
    'mock-lc-1',
    FICTIONAL_AUTHORS.mira,
    'Gated for testnet while we harden the proof pipeline, then opening up. Happy to add you to the early cohort.',
    '2026-06-26T16:02:00.000Z',
  ),
  comment(
    'c-lc1-3',
    'mock-lc-1',
    FICTIONAL_AUTHORS.sasha,
    'Congrats on the raise. Curious whether the verifiable-workload proofs will be portable across providers or bespoke per job.',
    '2026-06-26T17:15:00.000Z',
  ),
  // mock-pl-net-1 — the networking story; 6 comments to exercise "View all N"
  comment(
    'c-net1-1',
    'mock-pl-net-1',
    FICTIONAL_AUTHORS.sasha,
    'This is the missing piece for multi-rollup retrieval. Will the reference impl land in the next release or behind a flag?',
    '2026-06-20T15:40:00.000Z',
  ),
  comment(
    'c-net1-2',
    'mock-pl-net-1',
    FICTIONAL_AUTHORS.devon,
    'Behind a flag first, default-on once we have two independent rollups running it in production. Spec draft goes out this week.',
    '2026-06-20T16:05:00.000Z',
  ),
  comment(
    'c-net1-3',
    'mock-pl-net-1',
    FICTIONAL_AUTHORS.mira,
    'We would run it. The shared DHT alone cuts our bootstrap time in half — happy to be one of the early production nodes.',
    '2026-06-20T17:20:00.000Z',
  ),
  comment(
    'c-net1-4',
    'mock-pl-net-1',
    FICTIONAL_AUTHORS.priya,
    'Great to see this standardized rather than every team shipping its own. Is there a working group forming around the spec?',
    '2026-06-20T18:00:00.000Z',
  ),
  comment(
    'c-net1-5',
    'mock-pl-net-1',
    FICTIONAL_AUTHORS.sasha,
    'Count Filecoin in for review. The eclipse-resistance guarantees matter a lot for archival retrieval paths.',
    '2026-06-20T19:10:00.000Z',
  ),
  comment(
    'c-net1-6',
    'mock-pl-net-1',
    FICTIONAL_AUTHORS.devon,
    'Working group kickoff is next Thursday — thread with the agenda goes up tomorrow.',
    '2026-06-20T20:25:00.000Z',
  ),
  // fp_compute-pricing — exactly 2 (the visible-cap boundary)
  comment(
    'c-fp-pricing-1',
    'fp_compute-pricing',
    FICTIONAL_AUTHORS.priya,
    'We started fixed, then moved to a soft market once we had enough supply to keep prices stable. Fixed-first made the early buyer conversations far easier.',
    '2026-06-27T19:05:00.000Z',
  ),
  comment(
    'c-fp-pricing-2',
    'fp_compute-pricing',
    FICTIONAL_AUTHORS.sasha,
    'Watch out for long jobs getting priced out under spot — a reserved tier alongside the market helped us a lot.',
    '2026-06-27T20:12:00.000Z',
  ),
  // fp_shared-dht deliberately has none ("Be the first to comment")
  comment(
    'c-fp-prov-1',
    'fp_ai-provenance',
    FICTIONAL_AUTHORS.devon,
    'Required content hash is a must. I would also make the license field an enum rather than free text — it is the one people get wrong most often.',
    '2026-06-25T16:20:00.000Z',
  ),
  comment(
    'c-fp-onb-1',
    'fp_onboarding-funnel',
    FICTIONAL_AUTHORS.mira,
    'Moving grant discovery ahead of profile setup is the insight here. Please do share the funnel numbers — we are about to redo ours.',
    '2026-06-19T12:40:00.000Z',
  ),
];

// ---------- In-memory session store (rides this lazy chunk) ----------

interface MockFeedStore {
  commentsByUid: Map<string, IFeedComment[]>; // newest first
  likesByPostUid: Map<string, IFeedForumPostLikeStatus>;
  forbidden: boolean;
  nextCommentId: number;
}

function newestFirst(a: IFeedComment, b: IFeedComment): number {
  return b.createdAt.localeCompare(a.createdAt);
}

function buildStore(): MockFeedStore {
  const commentsByUid = new Map<string, IFeedComment[]>();
  for (const c of SEED_COMMENTS) {
    const list = commentsByUid.get(c.itemUid) ?? [];
    list.push(c);
    commentsByUid.set(c.itemUid, list);
  }
  for (const list of commentsByUid.values()) list.sort(newestFirst);
  return {
    commentsByUid,
    likesByPostUid: new Map(
      SEED_FORUM_POSTS.map((p) => [p.uid, { likeCount: p.likeCount, viewerHasLiked: p.viewerHasLiked }]),
    ),
    forbidden: false,
    nextCommentId: 1,
  };
}

let store = buildStore();

/** Test-only: module-level state leaks across Jest tests otherwise. */
export function resetMockFeedStore(): void {
  store = buildStore();
}

/** Test-only: makes getMockForumPosts throw the typed 403, so the
 *  "silently news-only" path has a real test instead of a mock-world blind spot. */
export function setMockForumPostsForbidden(forbidden: boolean): void {
  store.forbidden = forbidden;
}

function countFor(uid: string): number {
  return store.commentsByUid.get(uid)?.length ?? 0;
}

// Manual copies instead of structuredClone (not available in the jsdom test
// env). Responses must never alias store state — React Query caches them.
function cloneComment(c: IFeedComment): IFeedComment {
  return { ...c, author: { ...c.author } };
}

function clonePost(p: IFeedForumPost): IFeedForumPost {
  return { ...p, author: { ...p.author }, focusAreas: [...p.focusAreas] };
}

// ---------- Fetcher-shaped entry points (mirror feed.service signatures) ----------

export async function getMockForumPosts(): Promise<IFeedForumPostsResponse> {
  assertNotProduction();
  await delay();
  if (store.forbidden) throw new FeedForumPostsForbiddenError();
  return {
    items: SEED_FORUM_POSTS.map((p) => ({
      ...clonePost(p),
      ...store.likesByPostUid.get(p.uid),
      commentCount: countFor(p.uid),
    })),
  };
}

export async function getMockCommentCounts(uids: string[]): Promise<IFeedCommentCountsResponse> {
  assertNotProduction();
  await delay();
  return Object.fromEntries(uids.map((uid) => [uid, countFor(uid)]));
}

export async function getMockFeedComments(itemUid: string): Promise<IFeedCommentsResponse> {
  assertNotProduction();
  await delay();
  const items = store.commentsByUid.get(itemUid) ?? [];
  return { items: items.map(cloneComment), total: items.length };
}

export async function addMockFeedComment(
  request: ICreateFeedCommentRequest,
  viewer: IFeedAuthor,
): Promise<IFeedComment> {
  assertNotProduction();
  await delay();
  const text = request.text.trim();
  if (!text || text.includes(MOCK_FEED_FAIL_TOKEN)) {
    throw new Error('Mock feed store rejected the comment');
  }
  const created: IFeedComment = {
    uid: `c-mock-${store.nextCommentId++}`,
    itemUid: request.itemUid,
    author: viewer,
    text,
    createdAt: new Date().toISOString(),
  };
  const list = store.commentsByUid.get(request.itemUid) ?? [];
  store.commentsByUid.set(request.itemUid, [created, ...list]);
  return cloneComment(created);
}

export async function toggleMockForumPostLike(uid: string, isLiked: boolean): Promise<IFeedForumPostLikeStatus> {
  assertNotProduction();
  await delay();
  const current = store.likesByPostUid.get(uid);
  if (!current) throw new Error(`Unknown mock forum post: ${uid}`);
  if (current.viewerHasLiked !== isLiked) {
    current.likeCount += isLiked ? 1 : -1;
    current.viewerHasLiked = isLiked;
  }
  return { ...current };
}
