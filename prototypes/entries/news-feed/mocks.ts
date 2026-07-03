import type { ITeamNewsGroup, ITeamNewsItem } from '@/types/team-news.types';

// A network news feed spanning several teams, grouped by focus area — mirrors
// the shape the production homepage `TeamNews` receives (ITeamNewsGroup[]).

function item(partial: Partial<ITeamNewsItem> & Pick<ITeamNewsItem, 'uid' | 'teamUid' | 'teamName' | 'eventType' | 'eventDate' | 'title'>): ITeamNewsItem {
  return {
    teamLogoUrl: null,
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
    title: 'Protocol Labs announced the next IPFS mainnet upgrade, with faster content routing and lower retrieval latency.',
    sourceDomain: 'protocol.ai',
    discussion: { count: 4, latestTopicUrl: 'https://forum' },
  }),
  item({
    uid: 'n2',
    teamUid: 'drand',
    teamName: 'drand',
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-22T14:30:00.000Z',
    title: 'drand added two new league-of-entropy members, improving randomness beacon resilience.',
    sourceDomain: 'drand.love',
  }),
  item({
    uid: 'n3',
    teamUid: 'lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'FUNDING',
    eventDate: '2026-06-26T13:20:00.000Z',
    title: 'Lattice Compute closed a seed extension to build decentralized compute markets on top of IPFS.',
    discussion: { count: 2, latestTopicUrl: 'https://forum' },
  }),
  item({
    uid: 'n4',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'MILESTONE',
    eventDate: '2026-06-18T12:00:00.000Z',
    title: 'The network crossed 10,000 contributing builders across storage, compute, and networking projects.',
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
    title: 'Filecoin Foundation launched a grants round focused on verifiable storage for AI training datasets.',
    sourceDomain: 'fil.org',
    discussion: { count: 3, latestTopicUrl: 'https://forum' },
  }),
  item({
    uid: 'n6',
    teamUid: 'filecoin-foundation',
    teamName: 'Filecoin Foundation',
    eventType: 'MILESTONE',
    eventDate: '2026-06-24T12:00:00.000Z',
    title: 'The Filecoin network crossed 2,000 PiB of active storage deals — a new all-time high.',
    sourceDomain: 'fil.org',
  }),
  item({
    uid: 'n7',
    teamUid: 'lattice-compute',
    teamName: 'Lattice Compute',
    eventType: 'LAUNCH',
    eventDate: '2026-06-11T15:00:00.000Z',
    title: 'A new retrieval market client shipped, cutting cold-storage retrieval times by ~40%.',
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
    title: 'libp2p partnered with a major L2 to standardize peer discovery across rollup networks.',
    discussion: { count: 5, latestTopicUrl: 'https://forum' },
  }),
  item({
    uid: 'n9',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    eventType: 'PARTNERSHIP',
    eventDate: '2026-06-08T09:00:00.000Z',
    title: 'Protocol Labs joined a cross-industry working group on decentralized identity standards.',
    sourceDomain: 'protocol.ai',
  }),
  item({
    uid: 'n10',
    teamUid: 'libp2p',
    teamName: 'libp2p',
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-05T10:00:00.000Z',
    title: 'libp2p v0.40 shipped with a shared peer-routing table format across implementations.',
  }),
];

export const MOCK_GROUPS: ITeamNewsGroup[] = [
  { focusArea: { uid: 'fa-infra', title: 'Infrastructure' }, total: INFRA.length, items: INFRA },
  { focusArea: { uid: 'fa-storage', title: 'Storage' }, total: STORAGE.length, items: STORAGE },
  { focusArea: { uid: 'fa-networking', title: 'Networking' }, total: NETWORKING.length, items: NETWORKING },
];

/** Follower counts per team, for the small follow buttons. */
export const TEAM_FOLLOWERS: Record<string, number> = {
  'protocol-labs': 8472,
  'filecoin-foundation': 5610,
  'lattice-compute': 742,
  libp2p: 3180,
  drand: 410,
};
