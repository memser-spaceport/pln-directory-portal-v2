import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

// Local placeholder logos (same convention as the newsfeed-v0 mocks).
const TEAM_LOGOS: Record<string, string> = {
  'protocol-labs': '/icons/technology/ipfs.svg',
  'filecoin-foundation': '/icons/technology/filecoin.svg',
  'lattice-compute': '/icons/technology/fvm.svg',
  libp2p: '/icons/technology/libp2p.svg',
  drand: '/icons/technology/drand.svg',
};

/**
 * A story with its age expressed as an offset instead of a fixed date.
 *
 * The whole point of this prototype is "published since your last visit", so
 * every date has to be relative to *now* — a hard-coded June date would read as
 * two months old and no threshold would be judgeable. `hoursAgo` is resolved
 * into a real `eventDate` on the client (see `buildStories`), never at module
 * scope: the prototype page server-renders, and a date stamped during SSR would
 * differ from the one stamped at hydration.
 */
interface StorySeed {
  uid: string;
  teamUid: string;
  teamName: string;
  eventType: TeamNewsEventType;
  title: string;
  summary: string;
  sourceDomain: string;
  hoursAgo: number;
}

/**
 * Ordered newest-first. The first four are inside a day, so a "since yesterday"
 * last-seen mark produces a believable minority of new items; the rest spread
 * back over three weeks so a long-absence mark makes everything new.
 */
const STORY_SEEDS: StorySeed[] = [
  {
    uid: 'd1',
    teamUid: 'lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'FUNDING',
    title: 'Lattice Compute raises $4.2M seed extension',
    summary:
      'The extension was led by existing backers and funds a marketplace matching idle GPU capacity with verifiable workloads. A public testnet is planned for the fall.',
    sourceDomain: 'techcrunch.com',
    hoursAgo: 3,
  },
  {
    uid: 'd2',
    teamUid: 'drand',
    teamName: 'drand',
    eventType: 'ANNOUNCEMENT',
    title: 'League of Entropy grows to 24 independent operators',
    summary:
      'Two new organizations joined the beacon, improving geographic distribution and raising the quorum safety margin.',
    sourceDomain: 'drand.love',
    hoursAgo: 9,
  },
  {
    uid: 'd3',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'LAUNCH',
    title: 'IPFS mainnet upgrade cuts retrieval latency by a third',
    summary:
      'A new content-routing layer cuts average retrieval latency by roughly a third. Rollout starts with gateway operators next month.',
    sourceDomain: 'protocol.ai',
    hoursAgo: 20,
  },
  {
    uid: 'd4',
    teamUid: 'filecoin-foundation',
    teamName: 'Filecoin Foundation',
    eventType: 'PARTNERSHIP',
    title: 'Filecoin Foundation partners with two national archives',
    summary:
      'The partnership puts roughly 40TB of public-record material onto the network, with retrieval SLAs handled by regional storage providers.',
    sourceDomain: 'fil.org',
    hoursAgo: 27,
  },
  {
    uid: 'd5',
    teamUid: 'libp2p',
    teamName: 'libp2p',
    eventType: 'MILESTONE',
    title: 'libp2p ships QUIC transport as the default',
    summary:
      'QUIC becomes the default transport in the Go and Rust implementations after a two-release deprecation window for TCP fallback.',
    sourceDomain: 'libp2p.io',
    hoursAgo: 52,
  },
  {
    uid: 'd6',
    teamUid: 'lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'ANNOUNCEMENT',
    title: 'Lattice Compute doubles headcount, opens six roles',
    summary:
      'Six roles opened across protocol engineering and developer relations, ahead of a planned testnet launch this fall.',
    sourceDomain: 'lattice.dev',
    hoursAgo: 80,
  },
  {
    uid: 'd7',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'ANNOUNCEMENT',
    title: 'Network-wide research grants open for the fourth cohort',
    summary:
      'Applications are open through the end of the quarter, with a widened scope covering verifiable compute and content addressing.',
    sourceDomain: 'protocol.ai',
    hoursAgo: 140,
  },
  {
    uid: 'd8',
    teamUid: 'drand',
    teamName: 'drand',
    eventType: 'LAUNCH',
    title: 'drand publishes a timelock-encryption reference client',
    summary:
      'The reference client lands with test vectors and a browser build, closing the gap between the spec and the two existing partial implementations.',
    sourceDomain: 'drand.love',
    hoursAgo: 210,
  },
  {
    uid: 'd9',
    teamUid: 'filecoin-foundation',
    teamName: 'Filecoin Foundation',
    eventType: 'MILESTONE',
    title: 'Storage capacity passes the 30 EiB mark',
    summary:
      'Committed capacity crossed 30 EiB this week, with the largest quarter-on-quarter growth coming from providers in South America.',
    sourceDomain: 'fil.org',
    hoursAgo: 330,
  },
  {
    uid: 'd10',
    teamUid: 'libp2p',
    teamName: 'libp2p',
    eventType: 'PARTNERSHIP',
    title: 'libp2p joins an interop working group with three other stacks',
    summary:
      'The group publishes a shared conformance suite so transports and multiplexers can be tested across implementations rather than in isolation.',
    sourceDomain: 'libp2p.io',
    hoursAgo: 460,
  },
];

/**
 * Resolves the seeds into production-shaped `ITeamNewsItem`s against a caller
 * supplied `now`, so both the cards and the new/seen comparison read the same
 * clock.
 */
export function buildStories(now: number): ITeamNewsItem[] {
  return STORY_SEEDS.map((seed) => {
    const eventDate = new Date(now - seed.hoursAgo * 60 * 60 * 1000).toISOString();
    return {
      uid: seed.uid,
      teamUid: seed.teamUid,
      teamName: seed.teamName,
      teamLogoUrl: TEAM_LOGOS[seed.teamUid] ?? null,
      eventType: seed.eventType,
      eventDate,
      title: seed.title,
      summary: seed.summary,
      sourceUrl: `https://${seed.sourceDomain}`,
      sourceDomain: seed.sourceDomain,
      tags: [],
      focusAreas: [],
      subFocusAreas: [],
      createdAt: eventDate,
      discussion: { count: 0, latestTopicUrl: null },
    };
  });
}
