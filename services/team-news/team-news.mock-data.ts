import type { ITeamNewsGroup, ITeamNewsGroupedResponse, ITeamNewsItem } from '@/types/team-news.types';

// Dev-only fixture for exercising the team-grouped feed locally when the real
// API only returns a handful of items. Enable via MOCK_TEAM_NEWS=true — see
// team-news.service.ts and .env.example. Never used in production (gated
// behind an explicit env flag, and this module is only ever imported from a
// server-only service function).

function item(
  partial: Partial<ITeamNewsItem> &
    Pick<ITeamNewsItem, 'uid' | 'teamUid' | 'teamName' | 'eventType' | 'eventDate' | 'title'>,
): ITeamNewsItem {
  return {
    teamLogoUrl: null,
    summary: null,
    sourceUrl: 'https://example.com',
    sourceDomain: 'example.com',
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: partial.eventDate,
    discussion: { count: 0, latestTopicUrl: null },
    ...partial,
  };
}

// Protocol Labs: 5 stories in one focus area — exercises the "View all N
// updates" expander. Marked isFollowed so it also demos followed-first
// ordering (it's not the newest item overall, but should render first).
const PROTOCOL_LABS_INFRA: ITeamNewsItem[] = [
  item({
    uid: 'mock-pl-1',
    teamUid: 'mock-protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-07-04T16:00:00.000Z',
    title: 'IPFS mainnet upgrade cuts retrieval latency by a third',
    summary:
      'The upgrade introduces a new content-routing layer that cuts average retrieval latency by roughly a third. Rollout starts with gateway operators in July.',
    sourceDomain: 'protocol.ai',
    discussion: { count: 4, latestTopicUrl: '/forum/t/1' },
    isFollowed: true,
    upvoteCount: 12,
  }),
  item({
    uid: 'mock-pl-2',
    teamUid: 'mock-protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'MILESTONE',
    eventDate: '2026-06-28T12:00:00.000Z',
    title: 'Network crosses 10,000 contributing builders',
    summary: 'Contributor growth nearly doubled year over year, driven by the compute and AI-data tracks.',
    sourceDomain: 'protocol.ai',
    discussion: { count: 2, latestTopicUrl: '/forum/t/2' },
    isFollowed: true,
  }),
  item({
    uid: 'mock-pl-3',
    teamUid: 'mock-protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-24T09:30:00.000Z',
    title: 'Grants program expands to fund open-source AI tooling',
    summary:
      'A new track funds open-source tooling for verifiable AI data and model provenance, with grants up to $150k.',
    sourceDomain: 'protocol.ai',
    isFollowed: true,
    upvoteCount: 9,
  }),
  item({
    uid: 'mock-pl-4',
    teamUid: 'mock-protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'LAUNCH',
    eventDate: '2026-06-20T11:00:00.000Z',
    title: 'New developer portal unifies IPFS, Filecoin, and libp2p docs',
    summary: 'The portal brings the three projects’ documentation under one search and navigation.',
    sourceDomain: 'protocol.ai',
    isFollowed: true,
    upvoteCount: 3,
  }),
  item({
    uid: 'mock-pl-5',
    teamUid: 'mock-protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'PARTNERSHIP',
    eventDate: '2026-06-15T09:00:00.000Z',
    title: 'Protocol Labs joins decentralized identity working group',
    summary: 'The group will draft a shared spec for wallet-portable identity across networks.',
    sourceDomain: 'protocol.ai',
    isFollowed: true,
    upvoteCount: 1, // exactly below the Popular-this-week threshold (>=2) — demos the excluded case
  }),
];

// Protocol Labs also has a story filed under a second focus area — exercises
// the per-card remount-on-tab-switch fix (team spans multiple focus areas).
const PROTOCOL_LABS_NETWORKING: ITeamNewsItem[] = [
  item({
    uid: 'mock-pl-net-1',
    teamUid: 'mock-protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'PARTNERSHIP',
    eventDate: '2026-07-01T14:00:00.000Z',
    title: 'Protocol Labs and libp2p ship a shared DHT reference implementation',
    summary: 'A joint reference implementation ships with the next libp2p release.',
    sourceDomain: 'protocol.ai',
    isFollowed: true,
    upvoteCount: 5,
  }),
];

// Lattice Compute: 2 stories — under the expander threshold.
const LATTICE: ITeamNewsItem[] = [
  item({
    uid: 'mock-lc-1',
    teamUid: 'mock-lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'FUNDING',
    eventDate: '2026-07-03T13:20:00.000Z',
    title: 'Lattice Compute raises $4.2M seed extension',
    summary:
      'The $4.2M extension was led by existing backers and funds a marketplace matching idle GPU capacity with verifiable workloads.',
    discussion: { count: 2, latestTopicUrl: '/forum/t/3' },
    upvoteCount: 14, // highest count in the fixture set — the clear "Popular this week" #1
    isUpvoted: true, // demos the viewer-already-upvoted state
  }),
  item({
    uid: 'mock-lc-2',
    teamUid: 'mock-lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'LAUNCH',
    eventDate: '2026-06-18T15:00:00.000Z',
    title: 'New retrieval client cuts cold-storage reads by 40%',
    summary: 'Early adopters report cold-storage reads dropping from minutes to under thirty seconds.',
    discussion: { count: 1, latestTopicUrl: '/forum/t/4' },
    upvoteCount: 2, // exactly at the Popular-this-week threshold — demos the included boundary case
  }),
];

// Filecoin Foundation: 1 story — the simplest cluster shape (no expander).
const FILECOIN: ITeamNewsItem[] = [
  item({
    uid: 'mock-ff-1',
    teamUid: 'mock-filecoin-foundation',
    teamName: 'Filecoin Foundation',
    eventType: 'LAUNCH',
    eventDate: '2026-07-02T11:00:00.000Z',
    title: 'Grants round opens for verifiable AI-dataset storage',
    summary:
      'The round offers up to $250k per project for teams building provenance and verifiable-storage tooling for AI training data.',
    sourceDomain: 'fil.org',
    discussion: { count: 3, latestTopicUrl: '/forum/t/5' },
    upvoteCount: 6,
  }),
];

// libp2p: 1 story, intentionally with no summary — demos the graceful
// fallback when the API has no generated summary for an item.
const LIBP2P: ITeamNewsItem[] = [
  item({
    uid: 'mock-lp-1',
    teamUid: 'mock-libp2p',
    teamName: 'libp2p',
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-30T10:00:00.000Z',
    title: 'libp2p v0.40 ships shared peer-routing format',
  }),
];

const FA_INFRA = { uid: 'mock-fa-infra', title: 'Infrastructure' };
const FA_STORAGE = { uid: 'mock-fa-storage', title: 'Storage' };
const FA_NETWORKING = { uid: 'mock-fa-networking', title: 'Networking' };

const MOCK_GROUPS: ITeamNewsGroup[] = [
  {
    focusArea: FA_INFRA,
    total: PROTOCOL_LABS_INFRA.length + LATTICE.length,
    items: [...PROTOCOL_LABS_INFRA, ...LATTICE],
  },
  {
    focusArea: FA_STORAGE,
    total: FILECOIN.length,
    items: FILECOIN,
  },
  {
    focusArea: FA_NETWORKING,
    total: PROTOCOL_LABS_NETWORKING.length + LIBP2P.length,
    items: [...PROTOCOL_LABS_NETWORKING, ...LIBP2P],
  },
];

export const MOCK_TEAM_NEWS_GROUPED_RESPONSE: ITeamNewsGroupedResponse = {
  windowDays: 14,
  generatedAt: '2026-07-06T00:00:00.000Z',
  groups: MOCK_GROUPS,
};
