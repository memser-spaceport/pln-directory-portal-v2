import type { ITeam, IFormatedTeamProject } from '@/types/teams.types';
import type { IMember } from '@/types/members.types';
import type { IFocusArea } from '@/types/shared.types';
import type { ITeamFocusAres } from '@/components/page/team-details/TeamFocusAreas/types';
import type { ITeamNewsItem } from '@/types/team-news.types';
import type { IJobTeamGroup } from '@/types/jobs.types';

// The feed's own comment shape — the detail modal's thread is the feed's
// component, so the data has to be the feed's type, not a parallel one.
import type { FeedComment } from '../newsfeed-v0/mocks';
// This team's open roles live with every other team's, on the job board.
import { MOCK_JOB_GROUPS } from '../job-board/mocks';

// One full mock team. The detail-page sections only read the fields populated
// here. `logo` is left undefined so TeamDetails falls back to its dicebear
// default avatar (no remote-image domain config in this app).
//
// Tried the real PL mark and reverted: the only Protocol Labs asset in public/
// is the Demo Day wordmark at 142×24, which a square logo slot crops to "toc".
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
// Points at a real demo day so the badge / contribution tile actually deep-links
// to a page that loads (an invented slug renders an endless skeleton).
export const MOCK_TEAM_DEMO_DAY = { title: 'PL Demo Day W26.2', slug: 'plw262', date: 'Mar 2026' };

/* ---------------- IRL Contributions (event-primary) ----------------
   Event-keyed, not role-keyed: each event is one tile and the role(s) the team
   played hang off it as tags. Teams show up in many ways — hosting, sponsoring,
   speaking, or simply participating — so an event can carry several roles.
   Mirrors production's "MMM yyyy" date. */
export interface ContributionEvent {
  uid: string;
  name: string;
  date: string; // "MMM yyyy"
  roles: string[]; // Host | Sponsor | Speaker | Participant
  /** Real IRL gathering slug + location, so a tile deep-links to a page that loads. */
  slugURL?: string;
  location?: string;
}

// More events than fit in two rows, so the trailing "+N" tile shows and opens
// the full list in a modal. Newest first.
export const MOCK_CONTRIBUTIONS: ContributionEvent[] = [
  { uid: 'e1', name: 'Pragma Cannes', date: 'Jul 2026', roles: ['Host'], location: 'Cannes', slugURL: 'u8Kc9Lj3klyQ' },
  { uid: 'e2', name: 'EthBoulder 2026', date: 'Feb 2026', roles: ['Host', 'Speaker'], location: 'Lisbon', slugURL: '8ac0dtlC9wYw' },
  { uid: 'e3', name: 'Token2049', date: 'Oct 2025', roles: ['Sponsor'], location: 'Singapore', slugURL: 'token2049-2025' },
  { uid: 'e4', name: 'ETHCC', date: 'Jun 2025', roles: ['Speaker'], location: 'Cannes', slugURL: 'ethcc-cannes-2025' },
  { uid: 'e5', name: 'Devcon', date: 'Nov 2024', roles: ['Sponsor', 'Speaker'], location: 'Bangkok', slugURL: 'dev-con' },
  { uid: 'e6', name: 'LabWeek Web3', date: 'Nov 2024', roles: ['Participant'], location: 'Bangkok', slugURL: 'lw24-web3' },
  { uid: 'e7', name: 'DePIN Day Bangkok', date: 'Nov 2024', roles: ['Participant'], location: 'Bangkok', slugURL: 'depin-day-bngk' },
  { uid: 'e8', name: 'NPC Day Bangkok', date: 'Nov 2024', roles: ['Sponsor', 'Speaker'], location: 'Bangkok', slugURL: 'npc-day-bngk' },
  { uid: 'e9', name: 'OpenAGI Summit', date: 'Nov 2024', roles: ['Speaker'], location: 'Bangkok', slugURL: 'open-agi-summit' },
  { uid: 'e10', name: 'Investing in AI', date: 'Nov 2024', roles: ['Participant'], location: 'Bangkok', slugURL: 'invest-ai' },
];

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

/* Mock engagement per news item, keyed by uid — the newsfeed's Views · Likes ·
   Comments trio, same shape as that prototype's maps. Zeros are kept in on
   purpose: a rail where every story has traction is the one thing the real feed
   never looks like, and the counts are what tell you which story is worth the
   click. Views run an order of magnitude above likes, likes above comments, the
   way engagement actually falls off. */
export const NEWS_LIKES: Record<string, number> = {
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

export const NEWS_VIEWS: Record<string, number> = {
  'news-1': 1240,
  'news-2': 86,
  'news-3': 410,
  'news-4': 2180,
  'news-5': 630,
  'news-6': 295,
  'news-7': 870,
  'news-8': 54,
  'news-9': 188,
};

/**
 * Mock comment threads, in the feed's own `FeedComment` shape so the detail
 * modal's `CommentsThread` renders them unchanged. Flat with `parentUid`,
 * nested at render time — mirroring the production forum.
 *
 * The card counts are derived from these rather than hand-written beside them:
 * a card promising "4 Comments" over a modal with none is the exact lie this
 * prototype exists to avoid.
 */
export const NEWS_COMMENT_THREADS: Record<string, FeedComment[]> = {
  'news-1': [
    {
      uid: 'c-news-1-1',
      author: 'Devon Okoro',
      role: 'Protocol Engineer @ libp2p',
      text: 'Is the phased rollout opt-in for operators, or does the gateway default change land for everyone at once?',
      createdAt: '2026-06-21T12:20:00.000Z',
      likes: 3,
    },
    {
      uid: 'c-news-1-2',
      author: 'Mira Chen',
      role: 'Infrastructure Lead @ Protocol Labs',
      text: 'Opt-in for the first two weeks — the defaults flip after that, and the migration guide covers pinning your old behaviour if you need longer.',
      createdAt: '2026-06-21T13:05:00.000Z',
      parentUid: 'c-news-1-1',
      likes: 6,
    },
    {
      uid: 'c-news-1-3',
      author: 'Sam Whitfield',
      role: 'Storage Provider',
      text: 'The retrieval latency numbers match what we saw on the testnet. Content routing is the real win here.',
      createdAt: '2026-06-21T15:40:00.000Z',
      likes: 2,
    },
    {
      uid: 'c-news-1-4',
      author: 'Ana Duarte',
      role: 'Engineer @ Bacalhau',
      text: 'Any guidance for clusters still on the old bootstrap list?',
      createdAt: '2026-06-22T09:15:00.000Z',
      likes: 0,
    },
  ],
  'news-3': [
    {
      uid: 'c-news-3-1',
      author: 'Priya Raman',
      role: 'Networking @ libp2p',
      text: 'Conformance tests are the part that makes this real — without them "standard" just means "our implementation".',
      createdAt: '2026-06-20T17:30:00.000Z',
      likes: 5,
    },
  ],
  'news-4': [
    {
      uid: 'c-news-4-1',
      author: 'Tomas Nilsson',
      role: 'Analyst',
      text: 'Is the growth mostly large-dataset onboarding, or are renewals carrying it?',
      createdAt: '2026-06-18T14:10:00.000Z',
      likes: 1,
    },
    {
      uid: 'c-news-4-2',
      author: 'Mira Chen',
      role: 'Infrastructure Lead @ Protocol Labs',
      text: 'Roughly two thirds new onboarding this quarter. Renewals held steady, which is the healthier signal of the two.',
      createdAt: '2026-06-18T14:52:00.000Z',
      parentUid: 'c-news-4-1',
      likes: 4,
    },
    {
      uid: 'c-news-4-3',
      author: 'Sam Whitfield',
      role: 'Storage Provider',
      text: 'Capacity across three continents is the sentence worth reading twice.',
      createdAt: '2026-06-19T08:05:00.000Z',
      likes: 2,
    },
  ],
  'news-5': [
    {
      uid: 'c-news-5-1',
      author: 'Ana Duarte',
      role: 'Engineer @ Bacalhau',
      text: 'Congrats to the team. Is the compute layer going to be permissionless from launch?',
      createdAt: '2026-06-16T11:00:00.000Z',
      likes: 2,
    },
    {
      uid: 'c-news-5-2',
      author: 'Devon Okoro',
      role: 'Protocol Engineer @ libp2p',
      text: 'Gated for the first cohort, from what I heard at Camp — worth confirming with them directly.',
      createdAt: '2026-06-16T12:30:00.000Z',
      parentUid: 'c-news-5-1',
      likes: 1,
    },
  ],
  'news-7': [
    {
      uid: 'c-news-7-1',
      author: 'Priya Raman',
      role: 'Networking @ libp2p',
      text: '40% on cold storage is a bigger deal than the headline makes it sound.',
      createdAt: '2026-06-12T16:20:00.000Z',
      likes: 3,
    },
  ],
};

/** Card counts, derived — never written twice. */
export const commentCountFor = (uid: string): number => NEWS_COMMENT_THREADS[uid]?.length ?? 0;

/**
 * Open roles — looked up, not re-authored. The job board already groups every
 * role under its team, and this mock team IS its `protocol-labs` group (4
 * roles), so duplicating them here would give the same team two sets of jobs
 * that drift apart on the first edit.
 *
 * Those mocks date roles relative to `now`, which is why this page stays behind
 * its existing client-only mount gate.
 */
export const MOCK_TEAM_ROLES: IJobTeamGroup | null =
  MOCK_JOB_GROUPS.find((g) => g.team.uid === MOCK_TEAM.id) ?? null;
