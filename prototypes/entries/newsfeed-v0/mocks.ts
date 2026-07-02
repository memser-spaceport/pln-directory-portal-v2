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
      'Contributor growth nearly doubled year over year, driven by the compute and AI-data tracks. The team credits grants tooling and the new onboarding flow for the jump.',
    sourceDomain: 'protocol.ai',
    discussion: { count: 2, latestTopicUrl: 'https://forum' },
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
      'Active deals crossed 2,000 PiB for the first time, up 18% quarter over quarter. Growth was concentrated in archival datasets from research institutions.',
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
      'The client parallelizes deal retrieval across providers and verifies pieces as they stream. Early adopters report cold-storage reads dropping from minutes to under thirty seconds.',
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
};

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
