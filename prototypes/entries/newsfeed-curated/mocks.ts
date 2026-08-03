import type { ITeamNewsItem } from '@/types/team-news.types';

import { MOCK_GROUPS } from '../newsfeed-v0/mocks';

// This prototype builds on the newsfeed-v0 mock corpus rather than re-seeding it:
// the same 13 team-news items and 4 forum posts, plus three additions that the
// curated feed exists to demonstrate.
//
//   1. OFF_FOCUS_ITEMS — real network news that carries NO focus area. Under the
//      production spine these are unreachable: the home feed is fed by
//      GET /v1/team-news/grouped-by-focus-area, and TeamNews.tsx builds its "All"
//      tab as `groups.flatMap(g => g.items)`. An item in no group is in no tab —
//      including All. Prime Intellect is the real-world example that prompted this.
//   2. HIRING_SIGNALS — job-board activity rolled up into one feed-native signal
//      per team, rather than individual listings pasted into a news stream.
//   3. TOP_STORY — the week's single editorial pick, carrying its own reasoning.
//
// The demo depends on the top story being an OFF_FOCUS item: the story we would
// lead the week with is the one today's feed structurally cannot show.

// ---------- Focus area is carried by the group, not the item ----------

/** uid → focus-area title, derived from the group each item sits in. */
export const FOCUS_BY_UID: Record<string, string> = Object.fromEntries(
  MOCK_GROUPS.flatMap((g) => g.items.map((i) => [i.uid, g.focusArea.title])),
);

export const FOCUS_AREAS: string[] = MOCK_GROUPS.map((g) => g.focusArea.title);

/** Every item the grouped-by-focus-area endpoint can return today. */
export const GROUPED_ITEMS: ITeamNewsItem[] = MOCK_GROUPS.flatMap((g) => g.items);

// ---------- 1. The stories today's spine cannot reach ----------

const OFF_FOCUS_LOGOS: Record<string, string> = {
  'prime-intellect': '/icons/technology/libp2p.svg',
  'ritual-net': '/icons/technology/ipld.svg',
  'exo-labs': '/icons/technology/sourcecred.svg',
};

function offFocus(
  partial: Partial<ITeamNewsItem> &
    Pick<ITeamNewsItem, 'uid' | 'teamUid' | 'teamName' | 'eventType' | 'eventDate' | 'title'>,
): ITeamNewsItem {
  return {
    teamLogoUrl: OFF_FOCUS_LOGOS[partial.teamUid] ?? null,
    summary: null,
    sourceUrl: 'https://x.com',
    sourceDomain: 'x.com',
    tags: [],
    // The whole point: no focus area, so no group, so no way into the feed.
    focusAreas: [],
    subFocusAreas: [],
    createdAt: partial.eventDate,
    discussion: { count: 0, latestTopicUrl: null },
    ...partial,
  };
}

export const OFF_FOCUS_ITEMS: ITeamNewsItem[] = [
  offFocus({
    uid: 'x1',
    teamUid: 'prime-intellect',
    teamName: 'Prime Intellect',
    eventType: 'FUNDING',
    eventDate: '2026-07-29T09:15:00.000Z',
    title: 'Prime Intellect raises $18M to train frontier models across decentralized compute',
    summary:
      'The round funds a scheduler that splits training runs across volunteer and spot GPU capacity, with verifiable checkpoints between stages. Two network teams are already running workloads on the testnet.',
    sourceDomain: 'techcrunch.com',
    discussion: { count: 6, latestTopicUrl: 'https://forum' },
    tags: ['ai', 'compute', 'training'],
  }),
  offFocus({
    uid: 'x2',
    teamUid: 'ritual-net',
    teamName: 'Ritual',
    eventType: 'PARTNERSHIP',
    eventDate: '2026-07-28T14:00:00.000Z',
    title: 'Ritual and Lattice Compute open a shared inference marketplace',
    summary:
      'The two teams are pooling idle capacity behind one settlement layer, so a job posted to either network can be filled by the other. Early access opens to network teams in August.',
    sourceDomain: 'ritual.net',
    discussion: { count: 3, latestTopicUrl: 'https://forum' },
    tags: ['inference', 'compute'],
  }),
  offFocus({
    uid: 'x3',
    teamUid: 'exo-labs',
    teamName: 'Exo Labs',
    eventType: 'LAUNCH',
    eventDate: '2026-07-27T11:30:00.000Z',
    title: 'Exo ships on-device model sharding for consumer hardware',
    summary:
      'A single large model now runs split across a handful of laptops and phones on the same network, with no central coordinator. The release is MIT-licensed.',
    sourceDomain: 'exolabs.net',
    tags: ['edge', 'inference'],
  }),
];

/** Every item the curated spine carries: grouped + the untagged long tail. */
export const ALL_CURATED_ITEMS: ITeamNewsItem[] = [...OFF_FOCUS_ITEMS, ...GROUPED_ITEMS];

// ---------- 2. Hiring, as a signal rather than a listing ----------

/**
 * One roll-up per team per week, derived from job-board activity — the shape
 * production already returns as `IJobTeamGroup { team, totalRoles, roles[] }`.
 * Investor-relevant because hiring velocity reads as traction; a raw listing
 * does not. Clicking through hands off to /jobs rather than duplicating it.
 */
export interface HiringSignal {
  uid: string;
  teamUid: string;
  teamName: string;
  teamLogoUrl: string | null;
  /** The read-in-one-line claim, e.g. "is scaling its infra team". */
  headline: string;
  totalRoles: number;
  /** Roles to name explicitly; the rest collapse into "+N more". */
  roles: Array<{ title: string; location: string }>;
  /** Movement against the prior period — the actual signal. */
  trend: string;
  date: string;
}

/**
 * News items the hiring roll-up replaces. Once hiring is its own signal, a
 * one-off "team opens six roles" announcement is the same fact told twice — and
 * the roll-up tells it better (roles, trend, click-through). Dropped only on the
 * spine that shows hiring cards; today's spine keeps them, because there it is
 * the only way the fact appears at all.
 */
export const SUPERSEDED_BY_HIRING = new Set(['n11']);

export const HIRING_SIGNALS: HiringSignal[] = [
  {
    uid: 'h1',
    teamUid: 'lattice-compute',
    teamName: 'Lattice Compute',
    teamLogoUrl: '/icons/technology/fvm.svg',
    headline: 'is scaling its protocol team ahead of testnet',
    totalRoles: 6,
    roles: [
      { title: 'Senior Distributed Systems Engineer', location: 'Remote' },
      { title: 'Protocol Engineer', location: 'Remote · EU' },
      { title: 'Developer Relations Lead', location: 'Remote' },
    ],
    trend: 'First open roles in 8 months',
    date: '2026-07-28T10:00:00.000Z',
  },
  {
    uid: 'h2',
    teamUid: 'prime-intellect',
    teamName: 'Prime Intellect',
    teamLogoUrl: '/icons/technology/libp2p.svg',
    headline: 'opened 9 roles the week after its raise',
    totalRoles: 9,
    roles: [
      { title: 'ML Infrastructure Engineer', location: 'San Francisco' },
      { title: 'Research Scientist, Distributed Training', location: 'Remote' },
      { title: 'Head of Partnerships', location: 'San Francisco' },
    ],
    trend: 'Headcount plan roughly doubles',
    date: '2026-07-29T15:00:00.000Z',
  },
  {
    uid: 'h3',
    teamUid: 'filecoin-foundation',
    teamName: 'Filecoin Foundation',
    teamLogoUrl: '/icons/technology/filecoin.svg',
    headline: 'is rebuilding its data-programs group',
    totalRoles: 4,
    roles: [
      { title: 'Data Programs Manager', location: 'Remote' },
      { title: 'Solutions Architect', location: 'Remote · US' },
    ],
    trend: '4 roles opened this month',
    date: '2026-07-26T09:00:00.000Z',
  },
];

// ---------- 3. The week's single editorial pick ----------

export interface TopStory {
  /** uid of the item in ALL_CURATED_ITEMS this promotes. */
  uid: string;
  /** Monday of the week this edition covers. */
  weekOf: string;
  /**
   * The email subject, written rather than derived from the headline. Most
   * recipients never see anything else, and inbox clients cut around 60
   * characters — so it gets composed to that budget, not truncated into it.
   */
  subject: string;
  /**
   * Why this story won — shown verbatim under the headline. Without it an AI
   * pick reads as arbitrary, and an arbitrary pick costs trust in the whole feed.
   */
  why: string;
  /** How many candidates the pick was made from — sizes the judgement. */
  consideredCount: number;
  /** The runners-up, so the pick is legible as a choice rather than a lone result. */
  alsoConsidered: string[];
}

export const TOP_STORY: TopStory = {
  uid: 'x1',
  weekOf: '2026-07-27T00:00:00.000Z',
  subject: 'Prime Intellect raises $18M — plus 6 more from the network',
  why: 'Largest raise in the network this quarter, and the first time a decentralized-training team has shipped workloads onto two portfolio networks at once. Covered by four outlets in 48 hours.',
  consideredCount: 47,
  alsoConsidered: [
    'Ritual and Lattice Compute open a shared inference marketplace',
    'IPFS mainnet upgrade cuts retrieval latency by a third',
  ],
};

/** Who made this week's pick — the prototype's editorial-mode switch. */
export const CURATION_ATTRIBUTION = {
  human: 'Picked by the network team',
  ai: `Selected by AI from ${TOP_STORY.consideredCount} stories this week`,
} as const;

// ---------- 4. Follow suggestions that answer "why you" ----------

/**
 * Mirrors production's `ISuggestedTeam`, which already returns a `reason` string
 * from GET /v1/team-news/follow-suggestions — newsfeed-v0's local mock dropped
 * the field and rendered a tagline instead. A tagline answers *what they are*;
 * a reason answers *why you*. Only the second one earns a follow.
 */
export interface CuratedSuggestedTeam {
  uid: string;
  name: string;
  logo: string | null;
  /** Relational, not descriptive — states this team's connection to the viewer. */
  reason: string;
}

export const CURATED_SUGGESTED_TEAMS: CuratedSuggestedTeam[] = [
  {
    uid: 'prime-intellect',
    name: 'Prime Intellect',
    logo: '/icons/technology/libp2p.svg',
    reason: 'Raised this week · works with 2 teams you follow',
  },
  {
    uid: 'banyan-storage',
    name: 'Banyan Storage',
    logo: '/icons/technology/ipld.svg',
    reason: '3 people you know joined in the last month',
  },
  {
    uid: 'helia-labs',
    name: 'Helia Labs',
    logo: '/icons/technology/sourcecred.svg',
    reason: 'Same focus area as Lattice Compute',
  },
];

// ---------- Coverage, made visible ----------

/**
 * The gap the feed silently has today. Stated in the UI so a missing team is a
 * reportable thing rather than an invisible one — and so the number itself
 * becomes a metric someone can be accountable for.
 */
export const COVERAGE = {
  teamsTracked: 214,
  /** Stories this week carrying no focus area — unreachable under the group spine. */
  untaggedThisWeek: OFF_FOCUS_ITEMS.length,
};
