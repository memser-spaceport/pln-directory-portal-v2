import type { ITeamNewsGroup, ITeamNewsItem } from '@/types/team-news.types';

// Same shape the production homepage `TeamNews` receives (ITeamNewsGroup[]),
// extended with `summary` text so the V0 cards can render the AI summary that
// the API already returns but production never displays. Several teams have
// multiple items so team clustering is visible on the "All" tab.

// Local placeholder logos (same convention as the warm-intros mocks).
const TEAM_LOGOS: Record<string, string> = {
  'protocol-labs': '/icons/technology/ipfs.svg',
  'filecoin-foundation': '/icons/technology/filecoin.svg',
  'lattice-compute': '/icons/technology/fvm.svg',
  libp2p: '/icons/technology/libp2p.svg',
  drand: '/icons/technology/drand.svg',
};

function item(
  partial: Partial<ITeamNewsItem> & Pick<ITeamNewsItem, 'uid' | 'teamUid' | 'teamName' | 'eventType' | 'eventDate' | 'title'>,
): ITeamNewsItem {
  return {
    teamLogoUrl: TEAM_LOGOS[partial.teamUid] ?? null,
    summary: null,
    sourceUrl: 'https://x.com',
    sourceDomain: 'x.com',
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: partial.eventDate,
    discussion: { count: 0, latestTopicUrl: null },
    ...partial,
  };
}

const INFRA: ITeamNewsItem[] = [
  item({
    uid: 'n1',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-28T16:00:00.000Z',
    title: 'IPFS mainnet upgrade cuts retrieval latency by a third',
    summary:
      'The upgrade introduces a new content-routing layer that cuts average retrieval latency by roughly a third. Rollout starts with gateway operators in July, with full network adoption expected by Q4.',
    sourceDomain: 'protocol.ai',
    discussion: { count: 4, latestTopicUrl: 'https://forum' },
  }),
  item({
    uid: 'n2',
    teamUid: 'drand',
    teamName: 'drand',
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-22T14:30:00.000Z',
    title: 'League of Entropy grows to 24 independent operators',
    summary:
      'Two new organizations joined the League of Entropy, bringing the beacon to 24 independent operators. The additions improve geographic distribution and raise the quorum safety margin.',
    sourceDomain: 'drand.love',
  }),
  // Newer than the Lattice funding item below, but smaller news — demos the
  // "Top story" marker when the lead is picked by importance, not recency.
  item({
    uid: 'n11',
    teamUid: 'lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-29T10:00:00.000Z',
    title: 'Lattice Compute doubles headcount, opens six roles',
    summary:
      'Six new roles opened across protocol engineering and developer relations. The team plans to double headcount before the testnet launch this fall.',
  }),
  item({
    uid: 'n3',
    teamUid: 'lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'FUNDING',
    eventDate: '2026-06-26T13:20:00.000Z',
    title: 'Lattice Compute raises $4.2M seed extension',
    summary:
      'The $4.2M extension was led by existing backers and funds a marketplace matching idle GPU capacity with verifiable workloads. A public testnet is planned for the fall.',
  }),
  item({
    uid: 'n4',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'MILESTONE',
    eventDate: '2026-06-18T12:00:00.000Z',
    title: 'Network crosses 10,000 contributing builders',
    summary:
      'Contributor growth nearly doubled year over year, driven by the compute and AI-data tracks. The team credits grants tooling and the new onboarding flow for the jump.',
    sourceDomain: 'protocol.ai',
  }),
  // Two more Protocol Labs items (older than n1) so its card carries 5 stories —
  // demoing the "+N more" collapse on the second card in the feed.
  item({
    uid: 'n12',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-15T09:30:00.000Z',
    title: 'Grants program expands to fund open-source AI tooling',
    summary:
      'A new track funds open-source tooling for verifiable AI data and model provenance, with grants up to $150k. Applications open in July.',
    sourceDomain: 'protocol.ai',
  }),
  item({
    uid: 'n13',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'LAUNCH',
    eventDate: '2026-06-12T11:00:00.000Z',
    title: 'New developer portal unifies IPFS, Filecoin, and libp2p docs',
    summary:
      'The portal brings the three projects’ documentation under one search and navigation, with runnable examples and a shared getting-started path.',
    sourceDomain: 'protocol.ai',
  }),
];

const STORAGE: ITeamNewsItem[] = [
  item({
    uid: 'n5',
    teamUid: 'filecoin-foundation',
    teamName: 'Filecoin Foundation',
    eventType: 'LAUNCH',
    eventDate: '2026-06-27T11:00:00.000Z',
    title: 'Grants round opens for verifiable AI-dataset storage',
    summary:
      'The round offers up to $250k per project for teams building provenance and verifiable-storage tooling for AI training data. Applications close at the end of the month.',
    sourceDomain: 'fil.org',
  }),
  item({
    uid: 'n6',
    teamUid: 'filecoin-foundation',
    teamName: 'Filecoin Foundation',
    eventType: 'MILESTONE',
    eventDate: '2026-06-24T12:00:00.000Z',
    title: 'Filecoin crosses 2,000 PiB of active storage deals',
    summary:
      'Active deals crossed 2,000 PiB for the first time, up 18% quarter over quarter. Growth was concentrated in archival datasets from research institutions.',
    sourceDomain: 'fil.org',
  }),
  item({
    uid: 'n7',
    teamUid: 'lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'LAUNCH',
    eventDate: '2026-06-11T15:00:00.000Z',
    title: 'New retrieval client cuts cold-storage reads by 40%',
    summary:
      'The client parallelizes deal retrieval across providers and verifies pieces as they stream. Early adopters report cold-storage reads dropping from minutes to under thirty seconds.',
    sourceDomain: 'x.com',
  }),
];

const NETWORKING: ITeamNewsItem[] = [
  item({
    uid: 'n8',
    teamUid: 'libp2p',
    teamName: 'libp2p',
    eventType: 'PARTNERSHIP',
    eventDate: '2026-06-20T14:00:00.000Z',
    title: 'libp2p partners with major L2 on peer discovery',
    summary:
      'The collaboration standardizes peer discovery so rollup nodes can share a common DHT. A joint reference implementation ships with the next libp2p release.',
    discussion: { count: 5, latestTopicUrl: 'https://forum' },
  }),
  item({
    uid: 'n9',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'PARTNERSHIP',
    eventDate: '2026-06-08T09:00:00.000Z',
    title: 'Protocol Labs joins decentralized identity working group',
    summary:
      'The group will draft a shared spec for wallet-portable identity across networks. A first public draft is expected at the October summit.',
    sourceDomain: 'protocol.ai',
  }),
  // Intentionally left without a summary — shows the graceful fallback when the
  // API has no generated summary for an item.
  item({
    uid: 'n10',
    teamUid: 'libp2p',
    teamName: 'libp2p',
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-05T10:00:00.000Z',
    title: 'libp2p v0.40 ships shared peer-routing format',
  }),
];

export const MOCK_GROUPS: ITeamNewsGroup[] = [
  { focusArea: { uid: 'fa-infra', title: 'Infrastructure' }, total: INFRA.length, items: INFRA },
  { focusArea: { uid: 'fa-storage', title: 'Storage' }, total: STORAGE.length, items: STORAGE },
  { focusArea: { uid: 'fa-networking', title: 'Networking' }, total: NETWORKING.length, items: NETWORKING },
];

/**
 * Same story, multiple outlets. Keyed by item uid (same pattern as UPVOTES) so
 * the mock item type stays untouched. When an item has >1 source the feed card
 * collapses them into one "primary domain +N sources" affordance instead of
 * rendering a near-duplicate card per outlet. The first entry is the primary
 * (shown at rest); the rest reveal on expand. Items absent here keep their
 * single `sourceDomain` exactly as before.
 */
export interface NewsSource {
  domain: string;
  url: string;
}

export const SOURCES_BY_UID: Record<string, NewsSource[]> = {
  // Funding gets picked up widely — the widest aggregation in the feed.
  n3: [
    { domain: 'protocol.ai', url: 'https://protocol.ai' },
    { domain: 'techcrunch.com', url: 'https://techcrunch.com' },
    { domain: 'theblock.co', url: 'https://theblock.co' },
  ],
  // A protocol upgrade covered by the team blog + an industry outlet.
  n1: [
    { domain: 'protocol.ai', url: 'https://protocol.ai' },
    { domain: 'thedefiant.io', url: 'https://thedefiant.io' },
  ],
  // Partnership announced jointly, so two outlets carry it.
  n8: [
    { domain: 'messari.io', url: 'https://messari.io' },
    { domain: 'cointelegraph.com', url: 'https://cointelegraph.com' },
  ],
};

// ---------- Forum posts (interleaved into the feed, news-card style) ----------

/**
 * A member-authored forum post, rendered in the same card shell as a news story
 * but with the *author* on top where a news card shows the team. Shape is the
 * subset of the production forum `Topic` a listing card actually consumes
 * (author display name / role, title, teaser body, like + comment counts),
 * plus a `focusArea` so posts slot under the same focus-area tabs as news.
 */
export interface ForumPost {
  uid: string;
  /** Author display name — shown where a news card shows the team name. */
  author: string;
  /** "Founder @ Lattice Compute" — role @ team, exactly as the forum card composes it. */
  role: string;
  memberUid: string;
  title: string;
  /** Teaser body (plain text — the prototype skips the forum's HTML pipeline). */
  body: string;
  /** Forum category label, shown in the meta line where news shows its event type. */
  category: string;
  /** Aligns the post with a focus-area tab (same titles as MOCK_GROUPS). */
  focusArea: string;
  createdAt: string;
  tags: string[];
  /** Read count, shown in the forum-post meta trio (Views · Likes · Comments). */
  views: number;
}

export const FORUM_POSTS: ForumPost[] = [
  {
    uid: 'f1',
    author: 'Mira Chen',
    role: 'Founder @ Lattice Compute',
    memberUid: 'mira-chen',
    title: 'What pricing model actually works for verifiable GPU workloads?',
    body: 'We are weighing spot-style bidding against fixed per-proof pricing for the testnet. Spot keeps utilization high but makes cost unpredictable for buyers running long jobs. Curious how other compute teams landed on this — did you start fixed and move to a market, or the other way around?',
    category: 'Compute',
    focusArea: 'Infrastructure',
    createdAt: '2026-06-27T18:30:00.000Z',
    tags: ['compute', 'pricing'],
    views: 342,
  },
  {
    uid: 'f2',
    author: 'Devon Okoro',
    role: 'Protocol Engineer @ libp2p',
    memberUid: 'devon-okoro',
    title: 'Shared DHT for rollup peer discovery — worth standardizing?',
    body: 'Following the L2 partnership, a few of us sketched a common peer-routing format so rollup nodes can share one DHT instead of each shipping their own. Before we write it up as a spec proposal: who else would adopt this, and what breaks for you if discovery becomes shared infrastructure?',
    category: 'Networking',
    focusArea: 'Networking',
    createdAt: '2026-06-21T09:15:00.000Z',
    tags: ['libp2p', 'spec'],
    views: 514,
  },
  {
    uid: 'f3',
    author: 'Sasha Rao',
    role: 'Research Lead @ Filecoin Foundation',
    memberUid: 'sasha-rao',
    title: 'Provenance metadata for AI training sets — what should be mandatory?',
    body: 'As the verifiable-storage grants round opens, we want the metadata schema to be strict enough to be useful but not so heavy nobody fills it in. Leaning toward: source license, collection date, and a content hash as required; everything else optional. What would you add or cut?',
    category: 'Storage',
    focusArea: 'Storage',
    createdAt: '2026-06-25T14:45:00.000Z',
    tags: ['filecoin', 'ai-data'],
    views: 207,
  },
  {
    uid: 'f4',
    author: 'Priya Nair',
    role: 'Ecosystem Lead @ Protocol Labs',
    memberUid: 'priya-nair',
    title: 'Onboarding flow doubled contributor sign-ups — sharing what changed',
    body: 'Quick write-up for anyone rebuilding their onboarding: the biggest win was cutting the first-run steps from nine to four and moving grant discovery ahead of profile setup. Happy to share the before/after funnel numbers if useful.',
    category: 'Community',
    focusArea: 'Infrastructure',
    createdAt: '2026-06-19T11:20:00.000Z',
    tags: ['onboarding', 'grants'],
    views: 903,
  },
];

// ---------- Comments (mocked; the feed's comment threads read/write these) ----------

export interface FeedComment {
  uid: string;
  author: string;
  role: string;
  text: string;
  createdAt: string;
}

/**
 * Seed comment threads keyed by the news-story / forum-post uid the comments
 * hang off. Items absent here open an empty thread ("Be the first to comment").
 * The prototype appends new comments to a live copy of this map, so posting a
 * comment sticks for the session.
 */
export const COMMENTS_BY_UID: Record<string, FeedComment[]> = {
  n3: [
    {
      uid: 'c-n3-1',
      author: 'Devon Okoro',
      role: 'Protocol Engineer @ libp2p',
      text: 'Congrats! Is the GPU marketplace going to be permissionless from day one, or gated for the testnet?',
      createdAt: '2026-06-26T15:10:00.000Z',
    },
    {
      uid: 'c-n3-2',
      author: 'Mira Chen',
      role: 'Founder @ Lattice Compute',
      text: 'Gated for testnet while we harden the proof pipeline, then opening up. Happy to add you to the early cohort.',
      createdAt: '2026-06-26T16:02:00.000Z',
    },
    {
      uid: 'c-n3-3',
      author: 'Sasha Rao',
      role: 'Research Lead @ Filecoin Foundation',
      text: 'Congrats on the raise. Curious whether the verifiable-workload proofs will be portable across providers or bespoke per job.',
      createdAt: '2026-06-26T17:15:00.000Z',
    },
    {
      uid: 'c-n3-4',
      author: 'Priya Nair',
      role: 'Ecosystem Lead @ Protocol Labs',
      text: 'This is a great fit for the compute track — happy to help connect you with a few teams sitting on idle GPU capacity.',
      createdAt: '2026-06-26T18:40:00.000Z',
    },
  ],
  n8: [
    {
      uid: 'c-n8-1',
      author: 'Sasha Rao',
      role: 'Research Lead @ Filecoin Foundation',
      text: 'This is the missing piece for multi-rollup retrieval. Will the reference impl land in the next release or behind a flag?',
      createdAt: '2026-06-20T15:40:00.000Z',
    },
    {
      uid: 'c-n8-2',
      author: 'Devon Okoro',
      role: 'Protocol Engineer @ libp2p',
      text: 'Behind a flag first, default-on once we have two independent rollups running it in production. Spec draft goes out this week.',
      createdAt: '2026-06-20T16:05:00.000Z',
    },
    {
      uid: 'c-n8-3',
      author: 'Mira Chen',
      role: 'Founder @ Lattice Compute',
      text: 'We would run it. The shared DHT alone cuts our bootstrap time in half — happy to be one of the early production nodes.',
      createdAt: '2026-06-20T17:20:00.000Z',
    },
    {
      uid: 'c-n8-4',
      author: 'Priya Nair',
      role: 'Ecosystem Lead @ Protocol Labs',
      text: 'Great to see this standardized rather than every team shipping its own. Is there a working group forming around the spec?',
      createdAt: '2026-06-20T18:00:00.000Z',
    },
    {
      uid: 'c-n8-5',
      author: 'Sasha Rao',
      role: 'Research Lead @ Filecoin Foundation',
      text: 'Count Filecoin in for review. The eclipse-resistance guarantees matter a lot for archival retrieval paths.',
      createdAt: '2026-06-20T19:10:00.000Z',
    },
  ],
  f1: [
    {
      uid: 'c-f1-1',
      author: 'Priya Nair',
      role: 'Ecosystem Lead @ Protocol Labs',
      text: 'We started fixed, then moved to a soft market once we had enough supply to keep prices stable. Fixed-first made the early buyer conversations far easier.',
      createdAt: '2026-06-27T19:05:00.000Z',
    },
    {
      uid: 'c-f1-2',
      author: 'Sasha Rao',
      role: 'Research Lead @ Filecoin Foundation',
      text: 'Watch out for long jobs getting priced out under spot — a reserved tier alongside the market helped us a lot.',
      createdAt: '2026-06-27T20:12:00.000Z',
    },
  ],
  f2: [
    {
      uid: 'c-f2-1',
      author: 'Mira Chen',
      role: 'Founder @ Lattice Compute',
      text: 'We would adopt a shared DHT immediately. The one thing that breaks for us is custom record TTLs — as long as those stay configurable, count us in.',
      createdAt: '2026-06-21T10:30:00.000Z',
    },
  ],
  f3: [
    {
      uid: 'c-f3-1',
      author: 'Devon Okoro',
      role: 'Protocol Engineer @ libp2p',
      text: 'Required content hash is a must. I would also make the license field an enum rather than free text — it is the one people get wrong most often.',
      createdAt: '2026-06-25T16:20:00.000Z',
    },
    {
      uid: 'c-f3-2',
      author: 'Priya Nair',
      role: 'Ecosystem Lead @ Protocol Labs',
      text: 'Agree on keeping it lean. Could collection date be optional with a “best known” fallback? Some archival sets genuinely don’t have it.',
      createdAt: '2026-06-25T17:05:00.000Z',
    },
  ],
  f4: [
    {
      uid: 'c-f4-1',
      author: 'Mira Chen',
      role: 'Founder @ Lattice Compute',
      text: 'Moving grant discovery ahead of profile setup is the insight here. Please do share the funnel numbers — we’re about to redo ours.',
      createdAt: '2026-06-19T12:40:00.000Z',
    },
  ],
};

/**
 * Extra body paragraphs shown ONLY in the news detail modal — the feed card
 * keeps its short two-line teaser, while the modal reads as a fuller article.
 * Keyed by news-story uid; appended after the item's `summary` (rendered with
 * pre-line, so the blank line becomes a paragraph break). Items absent here just
 * show their normal summary in the modal.
 */
export const MODAL_EXTRA_BY_UID: Record<string, string> = {
  n1: 'Under the hood, the routing layer replaces recursive DHT walks with a cached provider index that most gateways can serve from memory, so popular content resolves in a single hop. Early adopters in the gateway program measured p95 retrieval dropping from just over two seconds to roughly 1.3 seconds on cold content.\n\nThe team is publishing a migration guide alongside the release and will run two office-hours sessions for operators before the network-wide rollout. Self-hosted nodes can opt in today behind a config flag; the default flips on once gateway coverage passes 80%.',
  n2: 'The two newcomers run infrastructure in regions the beacon previously had thin coverage in, shortening the worst-case path for a third of clients and removing a single-jurisdiction dependency from the quorum. The League published updated threshold parameters the same day.',
  n3: 'The extension keeps the round entirely with existing backers, which the team framed as a signal of conviction rather than a priced-up new round. Proceeds are earmarked for the matching engine that pairs idle GPU supply with verifiable workloads, plus the proving pipeline that lets buyers check work was done correctly without re-running it.\n\nA closed testnet opens to a small cohort of supply partners first, with public sign-ups following in the fall. The team is hiring across protocol engineering and developer relations to support it.',
  n4: 'Growth was concentrated in the compute and AI-data tracks, where new grants tooling shortened the path from first commit to funded work. The team credits the reworked onboarding flow — which now surfaces open grants before profile setup — for a large share of the jump.\n\nThe milestone comes with a caveat the team was candid about: retention of first-time contributors still trails the network average, and improving that is the focus for the next two quarters.',
  n5: 'Awards run up to $250k per project and are aimed squarely at provenance and verifiable-storage tooling for AI training data — schema work, content-hash indexing, and license tracking rather than raw capacity. Reviewers will weight projects that commit to open specs and reference implementations.\n\nApplications close at the end of the month, with decisions expected within six weeks. The Foundation is hosting an applicant Q&A and will publish anonymized excerpts from strong proposals afterward.',
  n6: 'The 2,000 PiB milestone was driven largely by archival datasets from research institutions moving off legacy cold storage, a segment that barely registered a year ago. Deal-making tooling improvements cut the median time-to-first-deal, which the team points to as the real unlock behind the number.\n\nThe Foundation cautioned that active-deal volume is a capacity metric, not a demand one, and said its next reporting update will break out retrieval activity to give a fuller picture of usage.',
  n7: 'The client parallelizes retrieval across providers and verifies each piece as it streams, so a slow or faulty provider no longer stalls the whole read. In early testing, cold-storage reads dropped from minutes to under thirty seconds for typical dataset sizes.\n\nIt ships as a drop-in library with the same interface as the previous client, and the team is collecting benchmarks from early adopters to tune the provider-selection heuristics before a broader release.',
  n8: 'The collaboration standardizes peer discovery so rollup nodes across networks can share a common DHT instead of each maintaining its own, cutting bootstrap time and reducing the eclipse-attack surface. A joint reference implementation ships with the next libp2p release.\n\nThe two teams are drafting the record format as an open spec and have invited other rollup teams into the review. Custom record TTLs stay configurable — a point several teams flagged as a hard requirement.',
  n9: 'The working group will draft a shared spec for wallet-portable identity that travels across networks, so a credential issued in one place can be presented in another without a bespoke integration. Protocol Labs joins as one of several infrastructure contributors.\n\nA first public draft is expected at the October summit, with a reference implementation to follow. The group is deliberately keeping scope narrow at the start — portable identifiers and attestations first, richer credential types later.',
  n11: 'The six roles span protocol engineering, developer relations, and a first dedicated security hire, reflecting a shift from research prototype toward a network people depend on. The team plans to double headcount before the testnet launch this fall.\n\nHiring is remote-first with a small in-person core, and the team is prioritizing candidates with prior open-source infrastructure experience. Referrals from the network get a fast-tracked first conversation.',
  n12: 'The new track funds open-source tooling for verifiable AI data and model provenance, with grants up to $150k and a lightweight application aimed at small teams and solo maintainers. Applications open in July.\n\nThe program is explicitly funding unglamorous infrastructure — schema validators, provenance indexers, license-checkers — rather than headline models, on the bet that shared tooling compounds across every team building on the network.',
  n13: 'The portal brings the IPFS, Filecoin, and libp2p documentation under one search and navigation, with runnable examples and a shared getting-started path so newcomers stop bouncing between three separate sites. Content is versioned and open to community contributions.\n\nThe team is treating this as a living surface: analytics on where readers drop off will drive the next round of edits, and there is an open call for example contributions from teams building in production.',
};

/**
 * Modal body authored as markdown with inline `[n](url)` citation links, for the
 * stories that actually have MULTIPLE sources (n1/n3/n8). `n` is the 1-based
 * index into SOURCES_BY_UID for that story, so a claim attributes to a specific
 * outlet — Perplexity / Husky style. Single-source stories are absent here and
 * render as plain prose (a citation on every sentence of a one-source
 * announcement is just noise). One markdown source powers both the inline `[n]`
 * and the superscript rendering.
 */
export const MODAL_CITED_BODY_BY_UID: Record<string, string> = {
  // n1 sources: [1] protocol.ai (team blog), [2] thedefiant.io (industry outlet)
  n1: `The upgrade introduces a new content-routing layer that cuts average retrieval latency by roughly a third.[1](https://protocol.ai) Rollout starts with gateway operators in July, with full network adoption expected by Q4.[1](https://protocol.ai)

Under the hood, the routing layer replaces recursive DHT walks with a cached provider index that most gateways can serve from memory, so popular content resolves in a single hop.[1](https://protocol.ai) Early adopters in the gateway program measured p95 retrieval dropping from just over two seconds to roughly 1.3 seconds on cold content.[2](https://thedefiant.io)

The team is publishing a migration guide alongside the release and will run two office-hours sessions for operators before the network-wide rollout.[1](https://protocol.ai) Analysts noted the change could meaningfully cut bandwidth costs for large gateway operators.[2](https://thedefiant.io)`,

  // n3 sources: [1] protocol.ai, [2] techcrunch.com, [3] theblock.co
  n3: `Lattice Compute raised a $4.2M seed extension led by existing backers to fund a marketplace matching idle GPU capacity with verifiable workloads.[2](https://techcrunch.com) The team framed the all-insider round as a signal of conviction rather than a priced-up raise.[3](https://theblock.co)

Proceeds go to the matching engine that pairs idle GPU supply with verifiable workloads, plus the proving pipeline that lets buyers check work was done correctly without re-running it.[1](https://protocol.ai) A public testnet is planned for the fall.[1](https://protocol.ai)

A closed testnet opens to a small cohort of supply partners first, with public sign-ups following later in the year.[1](https://protocol.ai) The company is hiring across protocol engineering and developer relations to support it.[2](https://techcrunch.com)`,

  // n8 sources: [1] messari.io, [2] cointelegraph.com
  n8: `libp2p is partnering with a major L2 to standardize peer discovery so rollup nodes across networks can share a common DHT instead of each maintaining its own.[1](https://messari.io) A joint reference implementation ships with the next libp2p release.[1](https://messari.io)

The collaboration cuts bootstrap time and reduces the eclipse-attack surface for participating rollups.[2](https://cointelegraph.com) Custom record TTLs stay configurable — a point several teams flagged as a hard requirement.[1](https://messari.io)

The two teams are drafting the record format as an open spec and have invited other rollup teams into the review.[2](https://cointelegraph.com)`,
};

/** Seed like counts per forum post (same "I like this" signal as the forum). */
export const FORUM_LIKES: Record<string, number> = {
  f1: 8,
  f2: 15,
  f3: 6,
  f4: 22,
};

/** Seed upvote counts per news item ("I'm interested" signal — no backend yet). */
export const UPVOTES: Record<string, number> = {
  n1: 12,
  n2: 0, // drand's lead — demos the hidden-zero state ("Upvote" with no count)
  n3: 9,
  n4: 6,
  n5: 14,
  n6: 7,
  n7: 5,
  n8: 11,
  n9: 3,
  n10: 2,
  n11: 4,
  n12: 3,
  n13: 1,
};

/**
 * Base "like" counts for every feed item, news and forum alike — the seed the
 * fully-functional Like button adds the viewer's own like to. News reuses the
 * existing per-story counts (V2 renames upvotes → likes); forum posts bring
 * their own. Keyed by story/post uid.
 */
export const BASE_LIKES: Record<string, number> = { ...UPVOTES, ...FORUM_LIKES };

/** Seed comment counts a story/post starts with, derived from the mock threads. */
export const seedCommentCount = (uid: string): number => COMMENTS_BY_UID[uid]?.length ?? 0;

/** Rail suggestions: teams NOT already in the feed (suggesting what you already read is redundant). */
export interface SuggestedTeam {
  uid: string;
  name: string;
  logo: string | null;
  /** 1-line team description, shown under the name in place of the industry. */
  description: string;
  /** Follower-count badge kept beneath the description. */
  followers: string;
}

export const SUGGESTED_TEAMS: SuggestedTeam[] = [
  {
    uid: 'banyan-storage',
    name: 'Banyan Storage',
    logo: '/icons/technology/ipld.svg',
    description: 'Decentralized hot storage for AI-scale datasets',
    followers: '1.2k followers',
  },
  {
    uid: 'helia-labs',
    name: 'Helia Labs',
    logo: '/icons/technology/sourcecred.svg',
    description: 'Lean, modular IPFS implementation for browsers and Node',
    followers: '890 followers',
  },
  {
    uid: 'textile',
    name: 'Textile',
    logo: null,
    description: 'Developer tools for building on IPFS and Filecoin',
    followers: '640 followers',
  },
];

// ---------- Focus Areas section (below the feed on the production home) ----------

export const PROTOCOL_VISION_URL = 'https://protocol.ai/blog/our-vision-for-the-future/';

/**
 * Shape consumed by the production `FocusAreaCard`: counts come from the
 * ancestor array lengths, avatars from the first three entries (null logo →
 * the default team/project icon).
 */
// Cycle real placeholder logos through the first three entries (the visible
// avatar stack); the rest fall back to the default icon.
const AVATAR_LOGOS = [
  '/icons/technology/ipfs.svg',
  '/icons/technology/filecoin.svg',
  '/icons/technology/libp2p.svg',
  '/icons/technology/fvm.svg',
  '/icons/technology/drand.svg',
  '/icons/technology/ipld.svg',
];

const teams = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ team: { uid: `t-${i}`, logo: { url: AVATAR_LOGOS[(i * 2) % AVATAR_LOGOS.length] } } }));
const projects = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ project: { uid: `p-${i}`, logo: { url: AVATAR_LOGOS[(i * 2 + 1) % AVATAR_LOGOS.length] } } }));

export const MOCK_FOCUS_AREAS: any[] = [
  {
    title: 'Public Goods',
    description:
      'Building open-source infrastructure, protocols, and tools that benefit everyone — funding mechanisms, governance experiments, and shared digital resources for the network and beyond.',
    teamAncestorFocusAreas: teams(32),
    projectAncestorFocusAreas: projects(21),
  },
  {
    title: 'Digital Human Rights',
    description:
      'Advancing privacy, data sovereignty, and freedom of information through decentralized identity, encryption, and censorship-resistant infrastructure that keeps individuals in control.',
    teamAncestorFocusAreas: teams(24),
    projectAncestorFocusAreas: projects(17),
  },
  {
    title: 'AI',
    description:
      'Ensuring artificial intelligence develops openly and safely — verifiable training data, decentralized compute markets, and transparent model governance across the network.',
    teamAncestorFocusAreas: teams(28),
    projectAncestorFocusAreas: projects(19),
  },
  {
    title: 'Neurotech',
    description: 'Accelerating responsible neurotechnology for human flourishing.',
    teamAncestorFocusAreas: teams(9),
    projectAncestorFocusAreas: projects(6),
  },
];
