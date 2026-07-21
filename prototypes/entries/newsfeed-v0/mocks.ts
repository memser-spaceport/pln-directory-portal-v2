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
      'The upgrade introduces a new content-routing layer that cuts average retrieval latency by roughly a third. Rollout starts with gateway operators in July, with full network adoption expected by Q4. The tiered routing table keeps frequently requested content warm across gateway nodes, so popular objects resolve in a single hop instead of walking the full DHT. Early benchmarks put median cold-fetch times under 600ms, down from about 900ms, with the biggest gains on content already cached near the edge.',
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
      'Two new organizations joined the League of Entropy, bringing the beacon to 24 independent operators. The additions improve geographic distribution and raise the quorum safety margin. Both operators run their nodes on independent infrastructure in new regions, reducing the chance that any single outage or jurisdiction can stall the randomness beacon. The League now spans five continents, and the team says onboarding two more operators is already underway.',
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
      'Six new roles opened across protocol engineering and developer relations. The team plans to double headcount before the testnet launch this fall. The hires span Rust and Go systems engineers, a developer-advocacy lead, and two roles focused on partner integrations ahead of the public testnet. Leadership says the expansion is funded by the recent seed extension and is meant to keep pace with demand for verifiable-compute capacity.',
  }),
  item({
    uid: 'n3',
    teamUid: 'lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'FUNDING',
    eventDate: '2026-06-26T13:20:00.000Z',
    title: 'Lattice Compute raises $4.2M seed extension',
    summary:
      'The $4.2M extension was led by existing backers and funds a marketplace matching idle GPU capacity with verifiable workloads. A public testnet is planned for the fall. Buyers pay only for compute they can cryptographically confirm ran as specified, a pitch aimed at teams wary of opaque cloud providers. The round extends Lattice\'s runway into 2027 as it onboards its first batch of capacity providers.',
    discussion: { count: 2, latestTopicUrl: 'https://forum' },
  }),
  item({
    uid: 'n4',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'MILESTONE',
    eventDate: '2026-06-18T12:00:00.000Z',
    title: 'Network crosses 10,000 contributing builders',
    summary:
      'Contributor growth nearly doubled year over year, driven by the compute and AI-data tracks. The team credits grants tooling and the new onboarding flow for the jump. Maintainers point to the unified contributor portal — which brings IPFS, Filecoin, and libp2p docs under one roof — as the biggest single driver, lowering the barrier for first-time committers. The milestone caps a year in which the network added more builders than in the previous three combined.',
    sourceDomain: 'protocol.ai',
    discussion: { count: 2, latestTopicUrl: 'https://forum' },
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
      'A new track funds open-source tooling for verifiable AI data and model provenance, with grants up to $150k. Applications open in July. The program targets libraries and services that let model builders prove where training data came from and that it has not been tampered with. Reviewers say they will prioritize tooling that plugs into existing ML pipelines over new standalone systems.',
    sourceDomain: 'protocol.ai',
    discussion: { count: 1, latestTopicUrl: 'https://forum' },
  }),
  item({
    uid: 'n13',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'LAUNCH',
    eventDate: '2026-06-12T11:00:00.000Z',
    title: 'New developer portal unifies IPFS, Filecoin, and libp2p docs',
    summary:
      'The portal brings the three projects’ documentation under one search and navigation, with runnable examples and a shared getting-started path. Developers can now move between IPFS, Filecoin, and libp2p guides without relearning a new layout each time, and every code sample can be run inline. The team says a unified search index was the most requested feature from the contributor survey earlier this year.',
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
      'The round offers up to $250k per project for teams building provenance and verifiable-storage tooling for AI training data. Applications close at the end of the month. The Foundation is targeting a growing gap: model builders increasingly need to demonstrate the origin and integrity of their datasets to regulators and customers alike. Staff say several teams have already shared working prototypes in the community forum ahead of the deadline.',
    sourceDomain: 'fil.org',
    discussion: { count: 3, latestTopicUrl: 'https://forum' },
  }),
  item({
    uid: 'n6',
    teamUid: 'filecoin-foundation',
    teamName: 'Filecoin Foundation',
    eventType: 'MILESTONE',
    eventDate: '2026-06-24T12:00:00.000Z',
    title: 'Filecoin crosses 2,000 PiB of active storage deals',
    summary:
      'Active deals crossed 2,000 PiB for the first time, up 18% quarter over quarter. Growth was concentrated in archival datasets from research institutions. Universities and national labs drove much of the increase, moving large genomics and climate datasets into verifiable long-term storage. The Foundation says retrieval reliability held steady even as total committed capacity climbed.',
    sourceDomain: 'fil.org',
    discussion: { count: 1, latestTopicUrl: 'https://forum' },
  }),
  item({
    uid: 'n7',
    teamUid: 'lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'LAUNCH',
    eventDate: '2026-06-11T15:00:00.000Z',
    title: 'New retrieval client cuts cold-storage reads by 40%',
    summary:
      'The client parallelizes deal retrieval across providers and verifies pieces as they stream. Early adopters report cold-storage reads dropping from minutes to under thirty seconds. By fetching pieces from multiple providers at once and checking each against its commitment as it arrives, the client removes the single-provider bottleneck that made cold reads slow. The team is releasing it as a drop-in library so existing applications can adopt it without rearchitecting.',
    sourceDomain: 'x.com',
    discussion: { count: 1, latestTopicUrl: 'https://forum' },
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
      'The collaboration standardizes peer discovery so rollup nodes can share a common DHT. A joint reference implementation ships with the next libp2p release. Today each network tends to run its own incompatible discovery layer, multiplying connection overhead for operators who span several chains. A draft specification is already under public review, and maintainers are inviting large-DHT operators to weigh in on the migration path.',
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
      'The group will draft a shared spec for wallet-portable identity across networks. A first public draft is expected at the October summit. The effort aims to let a single identity move between networks without re-provisioning credentials on each one. Participants include wallet vendors and infrastructure teams who have committed engineering time to the working group.',
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

// ---------- AI-generated article + sources (Perplexity-Discover-style reader) ----------

export interface NewsSource {
  /** Short display label, e.g. 'bbc', 'youtube', 'protocol.ai'. */
  label: string;
  url: string;
}

export interface ArticleParagraph {
  text: string;
  /** Indices into the article's `sources`, cited inline at the paragraph end. */
  cites?: number[];
}

/**
 * A full AI-written story: several paragraphs, each ending with inline source
 * pills, plus the flat source list rendered as a stacked "N sources" cluster.
 * The feed's short `summary` is the teaser; this is the opened read. Stories
 * without an entry fall back to a one-paragraph article built from their
 * summary + single source (see NewsReaderModal).
 */
export interface NewsArticle {
  paragraphs: ArticleParagraph[];
  sources: NewsSource[];
}

export const NEWS_ARTICLES: Record<string, NewsArticle> = {
  n1: {
    sources: [
      { label: 'protocol.ai', url: 'https://protocol.ai/blog' },
      { label: 'github', url: 'https://github.com' },
      { label: 'discuss.ipfs.tech', url: 'https://discuss.ipfs.tech' },
      { label: 'theblock', url: 'https://theblock.co' },
      { label: 'youtube', url: 'https://youtube.com' },
    ],
    paragraphs: [
      {
        text: 'Protocol Labs shipped a major IPFS mainnet upgrade on June 28, introducing a redesigned content-routing layer that the team says cuts average retrieval latency by roughly a third. The release, tagged go-ipfs v0.30, replaces the network\'s flat DHT lookups with a tiered routing table that keeps hot content paths warm across gateway nodes.',
        cites: [0, 1, 3],
      },
      {
        text: 'Rollout begins with gateway operators in July and is being staged region by region, with full network adoption expected by Q4. Operators running large deployments will be able to opt into the new routing table without downtime, and old and new nodes can coexist during the migration.',
        cites: [2],
      },
      {
        text: 'Early benchmarks published alongside the release show median fetch times dropping from about 900ms to under 600ms on cold content, with larger gains on popular objects already cached near the edge. Independent operators have begun reproducing the numbers on their own infrastructure.',
        cites: [4, 1],
      },
    ],
  },
  n3: {
    sources: [
      { label: 'lattice.xyz', url: 'https://lattice.xyz' },
      { label: 'theblock', url: 'https://theblock.co' },
      { label: 'crunchbase', url: 'https://crunchbase.com' },
      { label: 'x', url: 'https://x.com' },
    ],
    paragraphs: [
      {
        text: 'Lattice Compute has closed a $4.2 million seed extension led by its existing backers, the company confirmed this week. The round funds a marketplace that matches idle GPU capacity with verifiable workloads, letting buyers pay only for compute they can cryptographically confirm was run as specified.',
        cites: [0, 1, 2],
      },
      {
        text: 'The extension comes as demand for verifiable inference climbs among teams wary of opaque cloud providers. Lattice plans a public testnet in the fall and says the fresh capital extends its runway into 2027 while it onboards its first providers.',
        cites: [3],
      },
    ],
  },
  n4: {
    sources: [
      { label: 'protocol.ai', url: 'https://protocol.ai/blog' },
      { label: 'github', url: 'https://github.com' },
      { label: 'devrel-weekly', url: 'https://devrel.dev' },
    ],
    paragraphs: [
      {
        text: 'The Protocol Labs network crossed 10,000 contributing builders this month, roughly doubling year over year. The company attributes the surge to its compute and AI-data tracks, along with revamped grants tooling and a streamlined onboarding flow introduced earlier this year.',
        cites: [0, 1],
      },
      {
        text: 'Maintainers point to the new contributor portal — which unifies IPFS, Filecoin, and libp2p documentation — as a key driver, lowering the barrier for first-time committers. The team expects the pace to hold through the second half of the year.',
        cites: [2],
      },
    ],
  },
  n5: {
    sources: [
      { label: 'fil.org', url: 'https://fil.org/blog' },
      { label: 'coindesk', url: 'https://coindesk.com' },
      { label: 'x', url: 'https://x.com' },
      { label: 'youtube', url: 'https://youtube.com' },
    ],
    paragraphs: [
      {
        text: 'The Filecoin Foundation opened a new grants round offering up to $250,000 per project for teams building provenance and verifiable-storage tooling for AI training data. The program targets a growing gap: model builders increasingly need to prove where their datasets came from and that they haven\'t been tampered with.',
        cites: [0, 1],
      },
      {
        text: 'Applications close at the end of the month. Foundation staff say they are prioritizing tooling that plugs into existing ML pipelines over greenfield storage systems, and several teams have already shared prototypes in the community forum.',
        cites: [2, 3],
      },
    ],
  },
  n8: {
    sources: [
      { label: 'libp2p.io', url: 'https://libp2p.io/blog' },
      { label: 'github', url: 'https://github.com' },
      { label: 'discuss.libp2p.io', url: 'https://discuss.libp2p.io' },
      { label: 'theblock', url: 'https://theblock.co' },
    ],
    paragraphs: [
      {
        text: 'libp2p has partnered with a major Layer-2 network to standardize peer discovery, allowing rollup nodes to share a common distributed hash table instead of maintaining separate, incompatible ones. A joint reference implementation will ship with the next libp2p release.',
        cites: [0, 3],
      },
      {
        text: 'The collaboration aims to reduce the connection overhead that fragments today\'s multi-network deployments. A draft specification is already under public review, and maintainers are inviting operators of large DHTs to weigh in on the migration path before it\'s finalized.',
        cites: [1, 2],
      },
    ],
  },
};

// ---------- Forum posts (interleaved into the feed) ----------

export interface ForumPost {
  tid: string;
  /** Forum category, shown as the badge on the card. */
  category: string;
  title: string;
  /** Plain-text teaser (production strips markdown/images before display). */
  teaser: string;
  author: string;
  /** null → the card falls back to a generated default avatar. */
  authorImage: string | null;
  memberUid: string;
  /** "Role @Team", or '' when the author has no team role. */
  position: string;
  /** Matches a feed tab title so the post shows under the right focus area. */
  focusArea: string;
  timestamp: string;
  meta: { views: number; likes: number; comments: number };
}

/**
 * Network forum threads that surface in the feed alongside team news. Timestamps
 * are interleaved with the news items so the merged, newest-first ordering is
 * visible. Authored by members (not teams), so they render through the
 * production forum list-item shell rather than a team news card.
 */
export const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    tid: 'f1',
    category: 'Infrastructure',
    title: 'How are people handling GPU cost spikes on verifiable-compute workloads?',
    teaser:
      'We are seeing 3–4× swings week to week on burst capacity. Curious whether teams are pre-committing to providers, using the new Lattice matching, or just eating the variance. What has actually worked in production?',
    author: 'Maya Okoye',
    authorImage: null,
    memberUid: 'maya-okoye',
    position: 'Infra Lead @Helia Labs',
    focusArea: 'Infrastructure',
    timestamp: '2026-06-27T18:30:00.000Z',
    meta: { views: 214, likes: 18, comments: 12 },
  },
  {
    tid: 'f2',
    category: 'Funding',
    title: 'Seed-extension terms in this market — what are founders actually seeing?',
    teaser:
      'With a couple of extensions announced this month, wondering what terms look like right now: flat rounds, small step-ups, SAFE caps? Happy to compare notes privately if that is easier.',
    author: 'Devon Reyes',
    authorImage: null,
    memberUid: 'devon-reyes',
    position: 'Founder @Banyan Storage',
    focusArea: 'Storage',
    timestamp: '2026-06-25T15:10:00.000Z',
    meta: { views: 340, likes: 27, comments: 21 },
  },
  {
    tid: 'f3',
    category: 'AI',
    title: 'Provenance for AI training data — is anyone using the Filecoin grant tooling yet?',
    teaser:
      'Ahead of the grants round closing, I would love to hear from teams who have prototyped verifiable-dataset storage. What does the developer experience feel like end to end, and where does it still hurt?',
    author: 'Priya Nair',
    authorImage: null,
    memberUid: 'priya-nair',
    position: 'ML Engineer @Textile',
    focusArea: 'Storage',
    timestamp: '2026-06-23T09:45:00.000Z',
    meta: { views: 198, likes: 15, comments: 9 },
  },
  {
    tid: 'f4',
    category: 'Networking',
    title: 'Shared peer-routing format: migration path for existing DHT deployments?',
    teaser:
      'The libp2p partnership news got me thinking about upgrade order. For anyone running a large DHT today, how disruptive is moving to the shared format, and can old and new nodes coexist during rollout?',
    author: 'Sam Whitfield',
    authorImage: null,
    memberUid: 'sam-whitfield',
    position: 'Protocol Eng @libp2p',
    focusArea: 'Networking',
    timestamp: '2026-06-19T20:05:00.000Z',
    meta: { views: 156, likes: 11, comments: 7 },
  },
  {
    tid: 'f5',
    category: 'General',
    title: 'Onboarding new contributors: what finally moved the needle for your team?',
    teaser:
      'The network just crossed 10k builders. For teams that grew fast this year — was it grants tooling, better docs, office hours, something else? Trying to rebuild our own onboarding and want to steal what works.',
    author: 'Lena Fischer',
    authorImage: null,
    memberUid: 'lena-fischer',
    position: 'DevRel @Protocol Labs',
    focusArea: 'Infrastructure',
    timestamp: '2026-06-16T13:20:00.000Z',
    meta: { views: 402, likes: 33, comments: 24 },
  },
];

/** Rail suggestions: teams NOT already in the feed (suggesting what you already read is redundant). */
export interface SuggestedTeam {
  uid: string;
  name: string;
  logo: string | null;
  reason: string;
}

export const SUGGESTED_TEAMS: SuggestedTeam[] = [
  { uid: 'banyan-storage', name: 'Banyan Storage', logo: '/icons/technology/ipld.svg', reason: 'Storage · 1.2k followers' },
  { uid: 'helia-labs', name: 'Helia Labs', logo: '/icons/technology/sourcecred.svg', reason: 'Infrastructure · 890 followers' },
  { uid: 'textile', name: 'Textile', logo: null, reason: 'Networking · 640 followers' },
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
