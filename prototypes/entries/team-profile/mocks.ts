import type { ITeam, IFormatedTeamProject } from '@/types/teams.types';
import type { IMember } from '@/types/members.types';
import type { IFocusArea } from '@/types/shared.types';
import type { ITeamFocusAres } from '@/components/page/team-details/TeamFocusAreas/types';
import type { ITeamNewsItem } from '@/types/team-news.types';

// One full mock team. The detail-page sections only read the fields populated
// here. `logo` is left undefined so TeamDetails falls back to its dicebear
// default avatar (no remote-image domain config in this app).
export const MOCK_TEAM = {
  id: 'protocol-labs',
  name: 'Protocol Labs',
  shortDescription: 'Building protocols, tools, and services to radically improve the internet.',
  longDescription:
    '<p>Protocol Labs is an open-source R&amp;D lab that builds protocols, tools, and services to radically improve the internet. We drive breakthroughs in computing to push humanity forward — products include <strong>IPFS</strong>, <strong>Filecoin</strong>, and <strong>libp2p</strong>.</p><p>Our network spans hundreds of teams and thousands of builders working on decentralized storage, compute, networking, and cryptography.</p>',
  website: 'https://protocol.ai',
  twitter: 'https://twitter.com/protocollabs',
  linkedinHandle: 'https://www.linkedin.com/company/protocol-labs',
  telegramHandler: 'https://t.me/protocollabs',
  blog: 'https://protocol.ai/blog',
  contactMethod: 'https://protocol.ai/contact',
  fundingStage: { title: 'Growth' },
  isFund: true,
  industryTags: [
    { uid: 'i1', title: 'Infrastructure' },
    { uid: 'i2', title: 'Web3' },
    { uid: 'i3', title: 'Storage' },
    { uid: 'i4', title: 'Networking' },
    { uid: 'i5', title: 'Cryptography' },
    { uid: 'i6', title: 'Compute' },
  ],
  membershipSources: [
    { uid: 'm1', title: 'Protocol Labs' },
    { uid: 'm2', title: 'Filecoin Foundation' },
  ],
  communityAffiliations: [
    { uid: 'c1', title: 'IPFS Ecosystem' },
    { uid: 'c2', title: 'Filecoin Network' },
    { uid: 'c3', title: 'libp2p Working Group' },
  ],
  technologies: [
    { uid: 'te1', title: 'Go' },
    { uid: 'te2', title: 'Rust' },
  ],
  investorProfile: {
    uid: 'ip1',
    investmentFocus: ['Decentralized Storage', 'Web3 Infrastructure', 'Developer Tools'],
    typicalCheckSize: '500000',
    createdAt: '2023-01-01',
    updatedAt: '2023-06-01',
    teamUid: 'protocol-labs',
    memberUid: null,
    secRulesAccepted: true,
    investInStartupStages: ['Pre-Seed', 'Seed', 'Series A'],
    investInFundTypes: ['Venture', 'Ecosystem'],
  },
  teamFocusAreas: [],
  maintainingProjects: [],
  contributingProjects: [],
  asks: [],
} satisfies Partial<ITeam>;

/* --------------- Demo Day participation (drives the header badge) --------------- */
// Slug matches the completed demo day so the badge deep-links to its page.
export const MOCK_TEAM_DEMO_DAY = { title: 'Demo Day F25', slug: 'pl-demo-day-f25' };

/* ---------------- Followers (team view: who follows this team) ---------------- */
export interface TeamFollower {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export const MOCK_FOLLOWERS: TeamFollower[] = [
  { id: 'molly', name: 'Molly Mackinlay', role: 'Project Lead, IPFS', avatar: 'https://i.pravatar.cc/96?img=32' },
  { id: 'juan', name: 'Juan Benet', role: 'Founder & CEO · Protocol Labs', avatar: 'https://i.pravatar.cc/96?img=12' },
  { id: 'david', name: 'David Dias', role: 'Research Engineer · libp2p', avatar: 'https://i.pravatar.cc/96?img=15' },
  { id: 'maya', name: 'Maya Okonkwo', role: 'Co-founder & CEO · Lattice Compute', avatar: 'https://i.pravatar.cc/96?img=47' },
  { id: 'steven', name: 'Steven Allen', role: 'Systems Engineer', avatar: 'https://i.pravatar.cc/96?img=8' },
  { id: 'sarah', name: 'Sarah Kim', role: 'Partner · Acme Capital', avatar: 'https://i.pravatar.cc/96?img=44' },
  { id: 'devon', name: 'Devon Park', role: 'Protocol Engineer', avatar: 'https://i.pravatar.cc/96?img=53' },
  { id: 'lina', name: 'Lina Suarez', role: 'Developer Advocate', avatar: 'https://i.pravatar.cc/96?img=20' },
];

export const TEAM_FOLLOWER_COUNT = MOCK_FOLLOWERS.length;

export const MOCK_MEMBERS = [
  {
    id: 'mem-1',
    name: 'Juan Benet',
    teamLead: true,
    skills: [
      { uid: 's1', title: 'Distributed Systems' },
      { uid: 's2', title: 'Protocol Design' },
      { uid: 's3', title: 'Go' },
      { uid: 's4', title: 'Cryptography' },
    ],
    teams: [{ id: 'protocol-labs', name: 'Protocol Labs', role: 'Founder & CEO' }],
  },
  {
    id: 'mem-2',
    name: 'Molly Mackinlay',
    teamLead: false,
    skills: [
      { uid: 's5', title: 'Product' },
      { uid: 's6', title: 'Engineering Leadership' },
    ],
    teams: [{ id: 'protocol-labs', name: 'Protocol Labs', role: 'Project Lead, IPFS' }],
  },
  {
    id: 'mem-3',
    name: 'David Dias',
    teamLead: false,
    skills: [
      { uid: 's7', title: 'libp2p' },
      { uid: 's8', title: 'Networking' },
      { uid: 's9', title: 'JavaScript' },
    ],
    teams: [{ id: 'protocol-labs', name: 'Protocol Labs', role: 'Research Engineer' }],
  },
  {
    id: 'mem-4',
    name: 'Steven Allen',
    teamLead: false,
    skills: [
      { uid: 's10', title: 'Rust' },
      { uid: 's11', title: 'Systems Programming' },
    ],
    teams: [{ id: 'protocol-labs', name: 'Protocol Labs', role: 'Engineering' }],
  },
] as unknown as IMember[];

// Focus areas: top-level groups, each with children that match teamFocusAreas
// by uid (the hook joins them).
export const MOCK_FOCUS_AREAS: IFocusArea[] = [
  {
    uid: 'fa-infra',
    title: 'Internet Infrastructure',
    children: [
      { uid: 'fa-storage', title: 'Decentralized Storage' },
      { uid: 'fa-networking', title: 'Peer-to-Peer Networking' },
      { uid: 'fa-compute', title: 'Distributed Compute' },
    ],
  } as IFocusArea,
  {
    uid: 'fa-research',
    title: 'Research',
    children: [
      { uid: 'fa-crypto', title: 'Applied Cryptography' },
      { uid: 'fa-consensus', title: 'Consensus Protocols' },
    ],
  } as IFocusArea,
];

export const MOCK_TEAM_FOCUS_AREAS: ITeamFocusAres[] = [
  { uid: 'fa-storage', title: 'Decentralized Storage' },
  { uid: 'fa-networking', title: 'Peer-to-Peer Networking' },
  { uid: 'fa-compute', title: 'Distributed Compute' },
  { uid: 'fa-crypto', title: 'Applied Cryptography' },
];

export const MOCK_PROJECTS = [
  {
    uid: 'proj-ipfs',
    name: 'IPFS',
    tagline: 'A peer-to-peer hypermedia protocol to make the web faster, safer, and more open.',
    lookingForFunding: false,
    isMaintainingProject: true,
    isDeleted: false,
    hasEditAccess: false,
  },
  {
    uid: 'proj-filecoin',
    name: 'Filecoin',
    tagline: 'A decentralized storage network designed to store humanity’s most important information.',
    lookingForFunding: true,
    isMaintainingProject: true,
    isDeleted: false,
    hasEditAccess: false,
  },
  {
    uid: 'proj-libp2p',
    name: 'libp2p',
    tagline: 'A modular network stack for peer-to-peer applications.',
    lookingForFunding: false,
    isMaintainingProject: false,
    isDeleted: false,
    hasEditAccess: false,
  },
  {
    uid: 'proj-drand',
    name: 'drand',
    tagline: 'A distributed randomness beacon producing publicly verifiable random values.',
    lookingForFunding: false,
    isMaintainingProject: false,
    isDeleted: false,
    hasEditAccess: false,
  },
] as unknown as IFormatedTeamProject[];

/* ---------------- Team news (mirrors ITeamNewsItem from the homepage) ---------------- */
export const MOCK_NEWS: ITeamNewsItem[] = [
  {
    uid: 'news-1',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-21T10:00:00.000Z',
    title: 'Protocol Labs announces the next IPFS mainnet upgrade',
    summary:
      'The upgrade introduces faster content routing and lower retrieval latency, with a phased rollout for node operators beginning this quarter. A migration guide and updated gateway defaults ship alongside the release.',
    sourceUrl: 'https://x.com/protocollabs',
    sourceDomain: 'x.com',
    tags: ['IPFS'],
    focusAreas: ['Infrastructure'],
    subFocusAreas: [],
    createdAt: '2026-06-21T10:00:00.000Z',
    discussion: { count: 0, latestTopicUrl: null },
  },
  {
    uid: 'news-2',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'LAUNCH',
    eventDate: '2026-06-21T09:00:00.000Z',
    title: 'Filecoin Foundation opens a grants round for verifiable AI storage',
    summary:
      'The round funds teams building verifiable storage for AI training datasets, with milestones reviewed by the foundation’s research group. Selected projects also receive infrastructure credits and integration support from the ecosystem team.',
    sourceUrl: 'https://x.com/filecoin',
    sourceDomain: 'x.com',
    tags: ['Filecoin', 'Grants'],
    focusAreas: ['Storage'],
    subFocusAreas: [],
    createdAt: '2026-06-21T09:00:00.000Z',
    discussion: { count: 3, latestTopicUrl: null },
  },
  {
    uid: 'news-3',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'PARTNERSHIP',
    eventDate: '2026-06-20T14:00:00.000Z',
    title: 'libp2p partners with a major L2 on a peer discovery standard',
    summary:
      'The collaboration standardizes peer discovery across rollup networks so clients can interoperate without custom bootstrap code. A reference implementation and conformance tests will land in the next libp2p release.',
    sourceUrl: 'https://x.com/libp2p',
    sourceDomain: 'x.com',
    tags: ['libp2p'],
    focusAreas: ['Networking'],
    subFocusAreas: [],
    createdAt: '2026-06-20T14:00:00.000Z',
    discussion: { count: 1, latestTopicUrl: null },
  },
  {
    uid: 'news-4',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'MILESTONE',
    eventDate: '2026-06-18T12:00:00.000Z',
    title: 'Filecoin crosses 2,000 PiB of active storage deals',
    summary:
      'A new all-time high for the protocol, driven by growth in large-dataset onboarding and renewed enterprise storage deals. Storage providers added capacity across three continents to keep pace with demand.',
    sourceUrl: 'https://x.com/filecoin',
    sourceDomain: 'x.com',
    tags: ['Filecoin'],
    focusAreas: ['Storage'],
    subFocusAreas: [],
    createdAt: '2026-06-18T12:00:00.000Z',
    discussion: { count: 0, latestTopicUrl: null },
  },
  {
    uid: 'news-5',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'FUNDING',
    eventDate: '2026-06-16T08:00:00.000Z',
    title: 'PL-incubated team raises a seed round for decentralized compute',
    summary:
      'The round backs a compute marketplace built on top of IPFS, connecting idle hardware with verifiable workloads. The team plans to open a public testnet later this year and is hiring across protocol and infrastructure roles.',
    sourceUrl: 'https://x.com/protocollabs',
    sourceDomain: 'x.com',
    tags: ['Funding'],
    focusAreas: ['Infrastructure'],
    subFocusAreas: [],
    createdAt: '2026-06-16T08:00:00.000Z',
    discussion: { count: 2, latestTopicUrl: null },
  },
  {
    uid: 'news-6',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-14T11:00:00.000Z',
    title: 'IPFS Camp 2026 dates announced',
    summary:
      'This year’s camp adds a dedicated track on content-addressed AI pipelines alongside the core protocol workshops. Registration opens next month, with travel stipends available for first-time contributors and student teams.',
    sourceUrl: 'https://x.com/protocollabs',
    sourceDomain: 'x.com',
    tags: ['Events'],
    focusAreas: ['Infrastructure'],
    subFocusAreas: [],
    createdAt: '2026-06-14T11:00:00.000Z',
    discussion: { count: 0, latestTopicUrl: null },
  },
  {
    uid: 'news-7',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'LAUNCH',
    eventDate: '2026-06-11T15:00:00.000Z',
    title: 'New retrieval market client cuts cold-storage times by ~40%',
    summary:
      'The client ships smarter deal selection and parallel retrieval, cutting cold-storage retrieval times on Filecoin by roughly 40%. Operators can enable it behind a feature flag before it becomes the default next quarter.',
    sourceUrl: 'https://x.com/filecoin',
    sourceDomain: 'x.com',
    tags: ['Filecoin'],
    focusAreas: ['Storage'],
    subFocusAreas: [],
    createdAt: '2026-06-11T15:00:00.000Z',
    discussion: { count: 4, latestTopicUrl: null },
  },
  {
    uid: 'news-8',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'PARTNERSHIP',
    eventDate: '2026-06-08T09:00:00.000Z',
    title: 'Protocol Labs joins a decentralized identity working group',
    summary:
      'The cross-industry group is drafting shared standards for decentralized identity across networking and storage protocols. Protocol Labs will contribute reference tooling and help run interoperability test events.',
    sourceUrl: 'https://x.com/protocollabs',
    sourceDomain: 'x.com',
    tags: ['Identity'],
    focusAreas: ['Networking'],
    subFocusAreas: [],
    createdAt: '2026-06-08T09:00:00.000Z',
    discussion: { count: 1, latestTopicUrl: null },
  },
  {
    uid: 'news-9',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'OTHER',
    eventDate: '2026-06-04T13:00:00.000Z',
    title: 'Quarterly ecosystem report published',
    summary:
      'The report highlights growth across storage, compute, and networking projects, with deep dives into retrieval markets and developer activity. It also outlines research priorities and funding opportunities for the coming quarter.',
    sourceUrl: 'https://x.com/protocollabs',
    sourceDomain: 'x.com',
    tags: ['Report'],
    focusAreas: ['Infrastructure'],
    subFocusAreas: [],
    createdAt: '2026-06-04T13:00:00.000Z',
    discussion: { count: 0, latestTopicUrl: null },
  },
];

/* Mock upvote counts per news item, keyed by uid (same shape as the newsfeed
   prototype's UPVOTES). Zeros demo the hidden-zero state — plain "Upvote". */
export const NEWS_UPVOTES: Record<string, number> = {
  'news-1': 12,
  'news-2': 0,
  'news-3': 5,
  'news-4': 21,
  'news-5': 7,
  'news-6': 3,
  'news-7': 9,
  'news-8': 0,
  'news-9': 2,
};
