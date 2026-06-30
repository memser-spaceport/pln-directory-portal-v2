// Mocked personalized feed. Items span the three things following promises —
// team news, forum posts, and events — from both people and teams, so the
// re-sort actually demonstrates the value prop.

export type FeedKind = 'news' | 'forum' | 'event';

export interface FeedSource {
  id: string;
  type: 'team' | 'person';
  name: string;
  image?: string | null;
}

export interface FeedItem {
  id: string;
  kind: FeedKind;
  source: FeedSource;
  /** ISO timestamp. */
  time: string;
  title: string;
  // kind-specific
  newsLabel?: string;
  sourceDomain?: string;
  forum?: { category: string; replies: number; likes: number };
  event?: { date: string; location: string; role: 'attending' | 'speaking' };
}

/* ---------------- sources ---------------- */
const PROTOCOL_LABS: FeedSource = { id: 'protocol-labs', type: 'team', name: 'Protocol Labs' };
const LATTICE: FeedSource = { id: 'lattice-compute', type: 'team', name: 'Lattice Compute' };
const FILECOIN: FeedSource = { id: 'filecoin-foundation', type: 'team', name: 'Filecoin Foundation' };
const DRAND: FeedSource = { id: 'drand', type: 'team', name: 'drand' };

const MAYA: FeedSource = { id: 'maya-okonkwo', type: 'person', name: 'Maya Okonkwo', image: 'https://i.pravatar.cc/96?img=47' };
const JUAN: FeedSource = { id: 'juan-benet', type: 'person', name: 'Juan Benet', image: 'https://i.pravatar.cc/96?img=12' };
const MOLLY: FeedSource = { id: 'molly-mackinlay', type: 'person', name: 'Molly Mackinlay', image: 'https://i.pravatar.cc/96?img=32' };
const DAVID: FeedSource = { id: 'david-dias', type: 'person', name: 'David Dias', image: 'https://i.pravatar.cc/96?img=15' };

/** Everything you can follow, for the suggestion strip. */
export const SUGGESTIONS: (FeedSource & { subtitle: string; followers: number })[] = [
  { ...MAYA, subtitle: 'Co-founder & CEO · Lattice Compute', followers: 1283 },
  { ...PROTOCOL_LABS, subtitle: 'Infrastructure · Web3', followers: 8472 },
  { ...JUAN, subtitle: 'Founder & CEO · Protocol Labs', followers: 21940 },
  { ...FILECOIN, subtitle: 'Decentralized storage', followers: 5610 },
  { ...MOLLY, subtitle: 'Project Lead, IPFS', followers: 3104 },
  { ...LATTICE, subtitle: 'Verifiable compute markets', followers: 742 },
];

/** Demo presets the scenario switch maps onto. */
export const PRESETS: Record<'none' | 'few' | 'many', string[]> = {
  none: [],
  few: ['maya-okonkwo', 'protocol-labs'],
  many: ['maya-okonkwo', 'protocol-labs', 'juan-benet', 'filecoin-foundation', 'lattice-compute'],
};

export const FEED: FeedItem[] = [
  {
    id: 'f1',
    kind: 'forum',
    source: MAYA,
    time: '2026-06-29T08:10:00.000Z',
    title: 'Open benchmarks for zk proving on training workloads — would love eyes from infra folks',
    forum: { category: 'AI Infrastructure', replies: 12, likes: 34 },
  },
  {
    id: 'f2',
    kind: 'news',
    source: PROTOCOL_LABS,
    time: '2026-06-28T16:00:00.000Z',
    title: 'Protocol Labs announced the next IPFS mainnet upgrade, with faster content routing and lower retrieval latency.',
    newsLabel: 'Announcement',
    sourceDomain: 'protocol.ai',
  },
  {
    id: 'f3',
    kind: 'event',
    source: MAYA,
    time: '2026-06-28T09:30:00.000Z',
    title: 'IPFS Camp 2026 — Content-addressed AI pipelines',
    event: { date: 'Jul 8, 2026', location: 'Lisbon', role: 'speaking' },
  },
  {
    id: 'f4',
    kind: 'news',
    source: FILECOIN,
    time: '2026-06-27T11:00:00.000Z',
    title: 'Filecoin Foundation launched a grants round focused on verifiable storage for AI training datasets.',
    newsLabel: 'Launch',
    sourceDomain: 'fil.org',
  },
  {
    id: 'f5',
    kind: 'forum',
    source: JUAN,
    time: '2026-06-27T07:45:00.000Z',
    title: 'Thoughts on content-addressed everything: where the network goes in the next 18 months',
    forum: { category: 'Vision', replies: 47, likes: 210 },
  },
  {
    id: 'f6',
    kind: 'news',
    source: LATTICE,
    time: '2026-06-26T13:20:00.000Z',
    title: 'Lattice Compute closed a seed extension to build decentralized compute markets on top of IPFS.',
    newsLabel: 'Funding',
    sourceDomain: 'x.com',
  },
  {
    id: 'f7',
    kind: 'event',
    source: PROTOCOL_LABS,
    time: '2026-06-26T10:00:00.000Z',
    title: 'libp2p Day — Peer discovery across rollup networks',
    event: { date: 'Jul 15, 2026', location: 'Remote', role: 'attending' },
  },
  {
    id: 'f8',
    kind: 'forum',
    source: MOLLY,
    time: '2026-06-25T15:10:00.000Z',
    title: 'IPFS Gateway reliability: shipping the new retrieval client to all public gateways',
    forum: { category: 'IPFS', replies: 8, likes: 26 },
  },
  {
    id: 'f9',
    kind: 'news',
    source: FILECOIN,
    time: '2026-06-24T12:00:00.000Z',
    title: 'The Filecoin network crossed 2,000 PiB of active storage deals — a new all-time high.',
    newsLabel: 'Milestone',
    sourceDomain: 'fil.org',
  },
  {
    id: 'f10',
    kind: 'forum',
    source: DAVID,
    time: '2026-06-23T09:00:00.000Z',
    title: 'Proposal: a shared peer-routing table format for libp2p implementations',
    forum: { category: 'Networking', replies: 19, likes: 41 },
  },
  {
    id: 'f11',
    kind: 'news',
    source: DRAND,
    time: '2026-06-22T14:30:00.000Z',
    title: 'drand added two new league-of-entropy members, improving randomness beacon resilience.',
    newsLabel: 'Announcement',
    sourceDomain: 'drand.love',
  },
  {
    id: 'f12',
    kind: 'event',
    source: JUAN,
    time: '2026-06-21T18:00:00.000Z',
    title: 'Funding the Commons — Mechanisms for open infrastructure',
    event: { date: 'Jul 22, 2026', location: 'Berlin', role: 'speaking' },
  },
];
