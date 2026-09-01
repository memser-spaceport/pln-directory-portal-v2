// Mocked data for the Activity section (forum posts + comments + Bluesky).
// No production services / network — the shapes mirror what the real
// ForumActivity cards read, so PostCard / CommentCard can be imported and fed
// directly rather than re-created.

import type { Topic } from '@/services/forum/hooks/useForumPosts';
import type { ForumComment } from '@/components/page/member-details/ForumActivity/hooks/useUserForumComments';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { MOCK_MEMBER } from './mocks';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * The chart attached to the benchmarking post, drawn rather than sourced: this
 * is a diagram, and no stock service has one that says what the post says.
 * Inline because a prototype may not add files outside `prototypes/`, so
 * `/public` is not available to it.
 *
 * Two series, so identity is never colour-alone — both lines are labelled at
 * their right-hand end, and the labels wear text ink with a coloured line
 * beside them rather than being tinted themselves. The pair (#1b4dff, #e08a00)
 * was run through the dataviz validator: lightness band, chroma floor and CVD
 * separation all pass (worst adjacent ΔE 36.9 protan, 45.5 normal); the amber's
 * 2.62:1 contrast against the surface raises a WARN, which the direct labels are
 * the required relief for. One axis, no markers — at 268px they would collide.
 *
 * viewBox is 320×180 so one unit is close to one rendered pixel in the rail;
 * strokes and type are sized for that scale, not for a full-width chart.
 */
const BENCHMARK_CHART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180" role="img">
  <rect width="320" height="180" fill="#ffffff"/>
  <g stroke="#e6eaf1" stroke-width="1">
    <line x1="34" y1="24" x2="248" y2="24"/>
    <line x1="34" y1="53" x2="248" y2="53"/>
    <line x1="34" y1="82" x2="248" y2="82"/>
    <line x1="34" y1="111" x2="248" y2="111"/>
    <line x1="34" y1="140" x2="248" y2="140"/>
  </g>
  <g font-family="Inter, sans-serif" font-size="9" fill="#8897ae">
    <text x="29" y="143" text-anchor="end">0</text>
    <text x="29" y="85" text-anchor="end">50</text>
    <text x="29" y="27" text-anchor="end">100</text>
    <text x="34" y="156">1</text>
    <text x="141" y="156" text-anchor="middle">16</text>
    <text x="248" y="156" text-anchor="middle">128</text>
    <text x="34" y="172" fill="#455468">batch size → proofs/sec</text>
  </g>
  <polyline fill="none" stroke="#1b4dff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"
    points="34,29.8 64.6,33.3 95.1,37.9 125.7,41.4 156.3,47.2 186.9,51.8 217.4,56.5 248,61.1"/>
  <polyline fill="none" stroke="#e08a00" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"
    points="34,35.6 64.6,47.2 95.1,63.4 125.7,79.7 156.3,93.6 186.9,104 217.4,111 248,115.6"/>
  <g font-family="Inter, sans-serif" font-size="9.5" font-weight="500" fill="#0a0c11">
    <text x="254" y="64">synthetic</text>
    <text x="254" y="118">real</text>
  </g>
</svg>`;

const BENCHMARK_CHART = `data:image/svg+xml;utf8,${encodeURIComponent(BENCHMARK_CHART_SVG)}`;

// Evaluated at module load. The prototype gates its whole tree on a `mounted`
// flag, so nothing here is ever server-rendered — no hydration drift from the
// clock.
const NOW = Date.now();

const FORUM_USER = {
  uid: 41,
  username: 'mayaokonkwo',
  displayname: MOCK_MEMBER.name,
  // Empty on purpose: production's `ForumAvatar` falls back to
  // `getDefaultAvatar(displayname)` when `src` is missing, which is the same
  // placeholder the header renders. Leaving the field blank exercises that path
  // instead of pasting the result in twice.
  picture: '',
  userslug: 'mayaokonkwo',
  status: 'online',
  'icon:bgColor': '#1b4dff',
  'icon:text': 'M',
  isLocal: true,
};

/* ---------------- Forum posts (production PostCard reads these) ---------------- */
export const MOCK_FORUM_POSTS = [
  {
    tid: 1201,
    cid: 4,
    titleRaw: 'Fair-share GPU scheduling without a central broker',
    content:
      'We ended up with a two-level scheme: a coarse fair-share pass across tenants, then bin-packing inside each slice. The interesting part is preemption — killing a job at the wrong checkpoint boundary costs more than the fairness you bought.',
    timestamp: NOW - 3 * DAY,
    viewcount: 412,
    votes: 23,
    postcount: 13,
    user: FORUM_USER,
  },
  {
    tid: 1187,
    cid: 4,
    titleRaw: 'What we learned running proofs over real training workloads',
    content:
      'Six months of proof-bench numbers, warts included. Short version: proving overhead is survivable for inference and still brutal for training, and the gap is narrowing faster on the memory side than on the arithmetic side.',
    timestamp: NOW - 12 * DAY,
    viewcount: 908,
    votes: 47,
    postcount: 22,
    user: FORUM_USER,
  },
  {
    tid: 1140,
    cid: 7,
    titleRaw: 'Seed extension: what infra funds actually ask for',
    content:
      'Notes from twenty conversations. Nobody asked about the token. Everybody asked about utilisation and churn.',
    timestamp: NOW - 34 * DAY,
    viewcount: 655,
    votes: 31,
    postcount: 8,
    user: FORUM_USER,
  },
] as unknown as Topic[];

/* ---------------- Forum comments (production CommentCard reads these) ---------------- */
export const MOCK_FORUM_COMMENTS = [
  {
    pid: 90112,
    tid: 1233,
    content:
      'Worth separating two claims here. "Verifiable" as in the operator cannot lie about which model ran is close to practical. "Verifiable" as in you can re-derive the weights is not, and conflating them is why the benchmarks look so contradictory.',
    timestamp: NOW - 20 * HOUR,
    votes: 14,
    replies: 5,
    user: FORUM_USER,
    topic: { tid: 1233, titleRaw: 'Is verifiable compute practical in 2026?' },
    category: { cid: 4 },
  },
  {
    pid: 89740,
    tid: 1219,
    content:
      'Happy to run the infra track if nobody else has claimed it. I would rather it be three long sessions than nine lightning talks — the useful conversations last year all happened after minute twenty.',
    timestamp: NOW - 6 * DAY,
    votes: 9,
    replies: 3,
    user: FORUM_USER,
    topic: { tid: 1219, titleRaw: 'PL Summit — call for infra track proposals' },
    category: { cid: 2 },
  },
] as unknown as ForumComment[];

/* ---------------- Bluesky ---------------- */
// Read off the member record rather than restated here — the Contact details row
// and this tab point at the same account, so they get the same field.
export const MOCK_BLUESKY_HANDLE = MOCK_MEMBER.blueskyHandle;
export const MOCK_BLUESKY_PROFILE_URL = `https://bsky.app/profile/${MOCK_BLUESKY_HANDLE}`;

export interface BlueskyImage {
  url: string;
  alt: string;
}

/** An external link unfurled into a card, the way Bluesky renders one. */
export interface BlueskyLinkCard {
  url: string;
  domain: string;
  title: string;
  description: string;
  thumb: string;
}

/** A quoted post — someone else's, embedded inside this one. */
export interface BlueskyQuote {
  author: string;
  handle: string;
  avatar: string;
  text: string;
}

export interface BlueskyPost {
  id: string;
  url: string;
  /** Plain text. URLs, @handles and #tags are linkified at render time (see
   *  `linkifyPostText`) — Bluesky's real API ships byte-range facets, which is
   *  more faithful and unreadable in a mock file. */
  text: string;
  timestamp: number;
  likes: number;
  replies: number;
  /** Reposts now render: the card has its own action row, so unlike the earlier
   *  ForumStats version there is somewhere for a third count to live. */
  reposts: number;
  images?: BlueskyImage[];
  link?: BlueskyLinkCard;
  quote?: BlueskyQuote;
}

/**
 * Ordered so the three shapes a reader needs to recognise — media, an unfurled
 * link, a quote — are the first three. The tail is a plain text post with a
 * mention and a tag, which is what most of a real timeline looks like.
 */
export const MOCK_BLUESKY_POSTS: BlueskyPost[] = [
  {
    id: '3kq7',
    url: `${MOCK_BLUESKY_PROFILE_URL}/post/3kq7`,
    text: 'Spent the week benchmarking proof generation against real training runs instead of synthetic ones. The numbers are worse and far more useful — memory bandwidth breaks first, not the arithmetic.',
    timestamp: NOW - 2 * DAY,
    likes: 128,
    replies: 19,
    reposts: 34,
    images: [
      {
        url: BENCHMARK_CHART,
        alt: 'Proving throughput against batch size: the synthetic run degrades gently, the real run falls away sharply.',
      },
    ],
  },
  {
    id: '3kp2',
    url: `${MOCK_BLUESKY_PROFILE_URL}/post/3kp2`,
    text: 'Six months of proof-bench numbers, warts included. https://latticecompute.xyz/blog/proof-bench',
    timestamp: NOW - 5 * DAY,
    likes: 341,
    replies: 46,
    reposts: 88,
    link: {
      url: 'https://latticecompute.xyz/blog/proof-bench',
      domain: 'latticecompute.xyz',
      title: 'Proof-bench: six months of numbers',
      description: 'What actually breaks when you run zk proving over real training workloads, and what we changed.',
      // A fixed picsum id rather than `seed/…`, which is stable but opaque —
      // this one was chosen by looking. A skyline, so the card's thumb carries a
      // photographic subject against the drawn chart in the post above it, and
      // survives the 268×110 crop: the verticals read even when the top and
      // bottom go.
      thumb: 'https://picsum.photos/id/249/480/270',
    },
  },
  {
    id: '3kn9',
    url: `${MOCK_BLUESKY_PROFILE_URL}/post/3kn9`,
    text: 'This is the right frame. Auditability is a property of the schedule, not just of the output.',
    timestamp: NOW - 9 * DAY,
    likes: 76,
    replies: 8,
    reposts: 21,
    quote: {
      author: 'Protocol Labs',
      handle: 'protocol.ai',
      // Same placeholder, seeded off the account's own name — one avatar
      // treatment on the card, not a photo for the quoted account and shapes
      // for everyone else.
      avatar: getDefaultAvatar('Protocol Labs'),
      text: 'Open infrastructure only earns trust when the allocation is inspectable, not just the result. Worth reading the whole thread on scheduler fairness.',
    },
  },
  {
    id: '3km4',
    url: `${MOCK_BLUESKY_PROFILE_URL}/post/3km4`,
    text: 'The bottleneck for verifiable compute markets was never the proving system. It is scheduler fairness — nobody rents from a market where a bigger tenant can quietly starve them. cc @juanbenet.bsky.social #AIinfra',
    timestamp: NOW - 14 * DAY,
    likes: 512,
    replies: 63,
    reposts: 140,
  },
];

/* ---------------- Scenarios (the demo switch) ---------------- */
export type ActivityScenarioKey = 'shared' | 'owner' | 'connect' | 'not-shared';

export interface ActivityScenario {
  key: ActivityScenarioKey;
  label: string;
  /** Member has a Bluesky handle AND opted into showing posts. */
  showsBluesky: boolean;
  /** Viewer is the profile owner — gets the note about who can see this. */
  isOwner: boolean;
  /** No account connected yet. Only ever offered to the owner (see below). */
  notConnected?: boolean;
}

/**
 * Four states, because two variables cross here and the pairs behave
 * differently: whether an account is connected, and whether you are looking at
 * your own profile.
 *
 * The one that needs saying out loud is `not-shared`: a visitor looking at a
 * member with no Bluesky gets nothing at all. The connect prompt is an offer,
 * and there is nothing to offer someone who cannot act on it — showing a
 * stranger "Connect Bluesky" would invite them to connect an account that isn't
 * theirs.
 */
export const ACTIVITY_SCENARIOS: ActivityScenario[] = [
  { key: 'shared', label: 'Shared', showsBluesky: true, isOwner: false },
  { key: 'owner', label: 'Owner view', showsBluesky: true, isOwner: true },
  { key: 'connect', label: 'Not connected', showsBluesky: false, isOwner: true, notConnected: true },
  { key: 'not-shared', label: 'Not shared', showsBluesky: false, isOwner: false },
];

/**
 * How many posts the rail card shows.
 *
 * Two. The rail is a 300px column already carrying Relationship, team updates
 * and the booking card; a third post is paying rent in a place nobody scrolled
 * for. MOCK_BLUESKY_POSTS holds four so the quote and mention shapes are one
 * constant away — they're fixtures, not dead UI.
 */
export const POSTS_SHOWN = 2;

/**
 * Turns URLs, @handles and #tags in a post's text into segments the card can
 * render as links. A regex, not Bluesky's byte-range facets: the mocks stay
 * legible, and nothing downstream depends on the difference.
 */
export type TextSegment = { type: 'text' | 'link' | 'mention' | 'tag'; value: string; href?: string };

const SEGMENT_RE = /(https?:\/\/[^\s]+)|(@[A-Za-z0-9][A-Za-z0-9._-]*\.[A-Za-z]{2,})|(#[A-Za-z0-9_]+)/g;

export function linkifyPostText(text: string): TextSegment[] {
  const out: TextSegment[] = [];
  let last = 0;

  for (const m of text.matchAll(SEGMENT_RE)) {
    const at = m.index ?? 0;
    if (at > last) {
      out.push({ type: 'text', value: text.slice(last, at) });
    }
    if (m[1]) {
      out.push({ type: 'link', value: m[1].replace(/^https?:\/\//, ''), href: m[1] });
    } else if (m[2]) {
      out.push({ type: 'mention', value: m[2], href: `https://bsky.app/profile/${m[2].slice(1)}` });
    } else if (m[3]) {
      out.push({ type: 'tag', value: m[3], href: `https://bsky.app/hashtag/${m[3].slice(1)}` });
    }
    last = at + m[0].length;
  }

  if (last < text.length) {
    out.push({ type: 'text', value: text.slice(last) });
  }

  return out;
}
