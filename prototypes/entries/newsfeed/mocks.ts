import type { ITeamNewsItem } from '@/types/team-news.types';
// Production's own sector vocabulary — "robotics" already lives here, on the
// investors surface. The Monitor path borrows it rather than inventing one.
import { SECTOR_TAGS } from '@/services/investors/constants';
import type { SectorTag } from '@/services/investors/types';

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
  'proprio-labs': '/icons/technology/fvm.svg',
  'kinetic-foundry': '/icons/technology/filecoin.svg',
  // No bacalhau.svg ships in public/icons/technology, so it's deliberately absent
  // here — `teamLogoUrl` stays null and the feed card draws its monogram
  // fallback, which is what the teams grid shows for it too.
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

  // Robotics, added so the Monitor path's flagship query ("what fundings are new
  // in robotics?") has something to match. They are untagged like the rest of
  // this array — which is the point: robotics is a *sector*, and the feed's
  // focus-area taxonomy (Infrastructure / Storage / Networking here) has no
  // bucket for it. The two vocabularies are not the same vocabulary.
  offFocus({
    uid: 'r1',
    teamUid: 'proprio-labs',
    teamName: 'Proprio Labs',
    eventType: 'FUNDING',
    eventDate: '2026-07-30T08:00:00.000Z',
    title: 'Proprio Labs raises $26M for open-source robot foundation models',
    summary:
      'The round funds a shared manipulation model trained on pooled teleoperation data, with contributors keeping rights to their own recordings. Weights ship under Apache 2.0.',
    sourceDomain: 'techcrunch.com',
    discussion: { count: 4, latestTopicUrl: 'https://forum' },
    tags: ['robotics', 'manipulation', 'open-source'],
  }),
  offFocus({
    uid: 'r2',
    teamUid: 'kinetic-foundry',
    teamName: 'Kinetic Foundry',
    eventType: 'FUNDING',
    eventDate: '2026-07-26T13:45:00.000Z',
    title: 'Kinetic Foundry closes $9M seed for verifiable robot telemetry',
    summary:
      'Signed sensor logs let a fleet operator prove what a machine actually did, which the team is pitching at insurers and safety regulators first.',
    sourceDomain: 'kineticfoundry.com',
    tags: ['robotics', 'provenance'],
  }),
  offFocus({
    uid: 'r3',
    teamUid: 'proprio-labs',
    teamName: 'Proprio Labs',
    eventType: 'LAUNCH',
    eventDate: '2026-07-24T10:00:00.000Z',
    title: 'Proprio open-sources its 2M-episode grasp dataset',
    summary:
      'The dataset covers 400 household objects across twelve gripper types, with provenance for every episode. Released alongside a reproduction harness.',
    sourceDomain: 'proprio.dev',
    tags: ['robotics', 'datasets'],
  }),

  /**
   * Bacalhau, ported from the badge fixtures (`news-shared/mockTeamNews.ts`
   * NEWS_BY_TEAM.bacalhau) so the feed actually carries the team the teams grid
   * and the job board both badge.
   *
   * Without a cluster here there is no `[data-feed-team="bacalhau"]` anchor, so
   * `?focus=bacalhau` polls for ~2s and silently gives up — the reader lands on
   * a feed holding none of the stories they clicked. Off-focus is the right home:
   * bacalhau sits in no focus area, and these belong to this entry rather than
   * the shared newsfeed-v0 corpus.
   *
   * BOTH stories have to be here, not just the latest. `getTeamNews` returns the
   * curated match *instead of* the fixtures, so porting one would quietly drop
   * the grid badge from "2" to "1".
   */
  offFocus({
    uid: 'bac-news-1',
    teamUid: 'bacalhau',
    teamName: 'Bacalhau',
    eventType: 'FUNDING',
    eventDate: '2026-08-12T09:00:00.000Z',
    title: 'Bacalhau raises a $9M seed to run compute where the data already lives',
    summary:
      'The round is led by an infrastructure fund, with participation from several storage-provider operators. The team says the money goes to a managed offering and roughly doubling headcount.',
    sourceUrl: 'https://techcrunch.com/bacalhau-seed',
    sourceDomain: 'techcrunch.com',
    tags: ['compute', 'data'],
  }),
  offFocus({
    uid: 'bac-news-2',
    teamUid: 'bacalhau',
    teamName: 'Bacalhau',
    eventType: 'PARTNERSHIP',
    eventDate: '2026-07-17T09:00:00.000Z',
    title: 'Bacalhau joins a genomics consortium to process sequencing data in place',
    summary:
      'Pilot sites in Lisbon and Singapore will run jobs next to the sequencers instead of shipping data out. Keeping patient data in place is what let the consortium clear its own review board.',
    sourceUrl: 'https://wired.com/bacalhau-genomics',
    sourceDomain: 'wired.com',
    tags: ['compute', 'genomics'],
  }),
];

/** Every item the curated spine carries: grouped + the untagged long tail. */
export const ALL_CURATED_ITEMS: ITeamNewsItem[] = [...OFF_FOCUS_ITEMS, ...GROUPED_ITEMS];

// ---------- Sector, the axis the Monitor path actually queries ----------

/**
 * uid → sector, using **production's own vocabulary**: `SECTOR_TAGS` /
 * `SECTOR_TAG_LABEL` from `services/investors/constants.ts`. That list is where
 * "robotics" already exists in this codebase — on the investors surface, not on
 * news. Nothing is invented here.
 *
 * Three items are deliberately absent (`n4`, `n9`, `n11`). That is the whole
 * point of the Monitor prototype: an item with no sector can never match an
 * alert, and the reader has no way to know it was missed. Editorial survives
 * gaps like these because a human curator picks around them; a standing query
 * does not. The coverage line under the results names the number out loud.
 */
export const SECTOR_BY_UID: Record<string, SectorTag> = {
  // Robotics — the flagship query.
  r1: 'robotics',
  r2: 'robotics',
  r3: 'robotics',
  // AI
  x1: 'ai',
  x2: 'ai',
  x3: 'ai',
  n5: 'ai',
  n12: 'ai',
  // Infrastructure
  n1: 'infrastructure',
  n2: 'infrastructure',
  n3: 'infrastructure',
  n6: 'infrastructure',
  n7: 'infrastructure',
  n10: 'infrastructure',
  n13: 'infrastructure',
  // Crypto
  n8: 'crypto',
  // n4, n9, n11 — intentionally unclassified.
};

/** Sectors that actually occur this week, so the picker offers only live options. */
export const ACTIVE_SECTORS: SectorTag[] = SECTOR_TAGS.filter((s) => Object.values(SECTOR_BY_UID).includes(s));

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
  /**
   * Roles to name explicitly; the rest collapse into "+N more". `applyUrl`
   * mirrors production's `IJobRole.applyUrl` — the row's click target is the
   * posting itself, the same actionable unit the job board uses.
   */
  roles: Array<{ title: string; location: string; applyUrl: string }>;
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
      {
        title: 'Senior Distributed Systems Engineer',
        location: 'Remote',
        applyUrl: 'https://jobs.lattice.computer/senior-distributed-systems',
      },
      { title: 'Protocol Engineer', location: 'Remote · EU', applyUrl: 'https://jobs.lattice.computer/protocol' },
      { title: 'Developer Relations Lead', location: 'Remote', applyUrl: 'https://jobs.lattice.computer/devrel' },
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
      {
        title: 'ML Infrastructure Engineer',
        location: 'San Francisco',
        applyUrl: 'https://primeintellect.ai/careers/ml-infra',
      },
      {
        title: 'Research Scientist, Distributed Training',
        location: 'Remote',
        applyUrl: 'https://primeintellect.ai/careers/research-scientist',
      },
      {
        title: 'Head of Partnerships',
        location: 'San Francisco',
        applyUrl: 'https://primeintellect.ai/careers/partnerships',
      },
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
      { title: 'Data Programs Manager', location: 'Remote', applyUrl: 'https://fil.org/careers/data-programs' },
      {
        title: 'Solutions Architect',
        location: 'Remote · US',
        applyUrl: 'https://fil.org/careers/solutions-architect',
      },
    ],
    trend: '4 roles opened this month',
    date: '2026-07-26T09:00:00.000Z',
  },
];

// ---------- 2b. Perks, and the test they mostly fail ----------

/**
 * The second half of "put jobs and deals in the feed".
 *
 * Deals in this app are vendor perks — `SubmitDealModal` asks for a "Vendor Name
 * (e.g. Stripe, Vercel, AWS)" and "Redemption instructions" — and `/deals` is
 * described in the nav as "Exclusive tools and perks for founders". Two
 * consequences the feed has to answer for:
 *
 *   1. A perk is a *state*, not an event. "AWS credits exist" is true every week,
 *      so it has no cadence and lands in a chronological feed as an ad.
 *   2. Deals are access-gated — production ships a `DealsNoAccessModal` reading
 *      "you don't have access to Deals yet". Most people scrolling the feed are
 *      not the founder audience, so a perk card is shown largely to people who
 *      cannot redeem it.
 *
 * So the rule this prototype applies: only *announcement*-shaped perks enter the
 * mixed feed, capped at one. The catalogue-shaped ones are kept in the corpus on
 * purpose — the Deals pill shows them, so the difference between a perk that
 * earned its slot and one that didn't is visible on screen rather than asserted.
 */
export interface PerkSignal {
  uid: string;
  vendorName: string;
  logoUrl: string | null;
  /** Mirrors production's `IDeal.shortDescription`. */
  shortDescription: string;
  /** Mirrors production's `IDeal.category` — the gray chip on `DealCard`. */
  category: string;
  /** One of production's `DEAL_AUDIENCE_LABELS` values. */
  audience: string;
  /** Whether the person reading the feed could actually redeem it. */
  eligible: boolean;
  /**
   * Whether this is a dated event or a standing offer — the whole test.
   * 'announcement' earns a feed slot; 'catalogue' does not.
   */
  shape: 'announcement' | 'catalogue';
  /**
   * Why this is in a dated stream at all, as a short footer phrase — the offer
   * itself is carried by `shortDescription`, the way `DealCard` does it.
   */
  event: string;
  date: string;
  /** How long the offer has been live — the tell that gives a catalogue entry away. */
  liveFor: string;
}

export const PERK_SIGNALS: PerkSignal[] = [
  {
    uid: 'd1',
    vendorName: 'Vercel',
    logoUrl: null,
    shortDescription: 'Pro plan free for 12 months, then 20% off for network teams.',
    category: 'Infrastructure & Hosting',
    audience: 'All Founders',
    eligible: true,
    shape: 'announcement',
    event: 'Joined the network',
    date: '2026-07-28T12:00:00.000Z',
    liveFor: 'Added this week',
  },
  {
    uid: 'd2',
    vendorName: 'AWS',
    logoUrl: null,
    shortDescription: 'Up to $100k in Activate credits for eligible teams.',
    category: 'Cloud & Compute',
    audience: 'PL Funded Founders',
    eligible: false,
    shape: 'catalogue',
    event: 'Standing offer',
    date: '2025-05-14T12:00:00.000Z',
    liveFor: 'Live for 14 months',
  },
  {
    uid: 'd3',
    vendorName: 'Notion',
    logoUrl: null,
    shortDescription: 'Six months of Notion Plus with unlimited AI.',
    category: 'AI & Developer Tools',
    audience: 'Founders Forge',
    eligible: false,
    shape: 'catalogue',
    event: 'Standing offer',
    date: '2025-11-03T12:00:00.000Z',
    liveFor: 'Live for 8 months',
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
  /**
   * The single-story version's body, as sections. Only that version reads it —
   * with three stories in the block there is no room, and with one there is
   * nothing else to spend the space on.
   *
   * Subheads exist because past three or four paragraphs an unbroken column stops
   * being scannable, and the block's whole job is to be readable at a glance
   * first and in depth second. The opening section carries no heading: a reader
   * should get the story before they get its structure.
   */
  longSummary: Array<{ heading?: string; paragraphs: string[] }>;
  /** How many candidates the pick was made from — sizes the judgement. */
  consideredCount: number;
  /**
   * The other two stories in the block, as uids.
   *
   * These were the runners-up hidden behind an "Also considered" disclosure. A
   * collapsed list of titles nobody opens is worth less than two visible rows,
   * and promoting them is what turns a single billboard into a three-story
   * block — one pick can miss you entirely, three has a real chance of landing.
   * Only the lead carries a why-line: three written justifications a week is
   * three times the editorial cost, and the point of starting human is that one
   * person can sustain it.
   */
  alsoUids: string[];
}

export const TOP_STORY: TopStory = {
  uid: 'x1',
  weekOf: '2026-07-27T00:00:00.000Z',
  subject: 'Prime Intellect raises $18M — plus 6 more from the network',
  why: 'Largest raise in the network this quarter, and the first time a decentralized-training team has shipped workloads onto two portfolio networks at once. Covered by four outlets in 48 hours.',
  /**
   * The single-story version's body. One pick means the space that carried two
   * runner-up rows goes back into the pick itself — so this is what the editor
   * writes instead of a headline and a clamped teaser: what happened, who it
   * touches in the network, and what to watch next.
   */
  longSummary: [
    {
      paragraphs: [
        'The largest raise in the network this quarter, led by existing backers. It funds a scheduler that splits training runs across volunteer and spot GPU capacity, with verifiable checkpoints between stages — so a job can resume on different hardware without trusting the machine that ran it.',
      ],
    },
    {
      heading: 'What is already running',
      paragraphs: [
        'Lattice Compute is contributing idle capacity between its own jobs; Ritual is routing through the shared inference marketplace it opened this week. That makes Prime Intellect the first decentralized-training team to ship onto two portfolio networks at once.',
      ],
    },
    {
      heading: 'Why it matters',
      paragraphs: [
        'Decentralized training has had a credibility problem — plenty of schedulers, little evidence anyone trains anything real on them. Two live integrations inside one network is the closest thing to that evidence so far.',
      ],
    },
    {
      heading: 'What to watch',
      paragraphs: [
        'Public sign-ups follow in the autumn. The team opened nine roles the week after the raise, weighted toward ML infrastructure — a pattern that reads as scaling the scheduler, not the research bet.',
      ],
    },
  ],
  consideredCount: 47,
  // x2 = Ritual × Lattice inference marketplace, n1 = IPFS retrieval latency.
  // One untagged, one Infrastructure — so the block spans the focus taxonomy the
  // same way the week does.
  alsoUids: ['x2', 'n1'],
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
