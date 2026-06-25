// Mocked data for the member-affinity-profile prototype.
// No production services / network — everything the screen needs lives here.
// The shapes mirror the fields the production member-detail components read so
// we can feed them straight into the real components.

import type { FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';

export type FrequencyTier = 'high' | 'steady' | 'cooling' | 'neglected';

export interface MonthlyInteraction {
  label: string;
  count: number;
}

export interface RelationshipOwner {
  name: string;
  role: string;
  avatar: string;
}

export interface LastContact {
  when: string;
  date: string;
  channel: 'email' | 'meeting';
  summary: string;
}

export interface AffinityRelationship {
  owner: RelationshipOwner;
  lastContact: LastContact;
  tier: FrequencyTier;
  windowMonths: number;
  months: MonthlyInteraction[];
}

export const TIER_META: Record<
  FrequencyTier,
  { label: string; variant: 'success' | 'brand' | 'warning' | 'error'; hint: string }
> = {
  high: {
    label: 'High touch',
    variant: 'success',
    hint: 'Engaged frequently and recently — this relationship is warm.',
  },
  steady: {
    label: 'Steady',
    variant: 'brand',
    hint: 'Regular, predictable contact over the window.',
  },
  cooling: {
    label: 'Cooling off',
    variant: 'warning',
    hint: 'Contact has slowed in recent months — worth a nudge.',
  },
  neglected: {
    label: 'Neglected',
    variant: 'error',
    hint: 'Little to no contact lately — at risk of going cold.',
  },
};

/* ---------------- Full founder profile (mirrors IMember view fields) ---------------- */
export const MOCK_AVATAR = 'https://i.pravatar.cc/160?img=47';

export const MOCK_MEMBER = {
  id: 'maya-okonkwo',
  name: 'Maya Okonkwo',
  profile: MOCK_AVATAR,
  role: 'Co-founder & CEO',
  locationLabel: 'Lisbon, Portugal',
  openToWork: true,
  teamLead: true,
  email: 'maya@latticecompute.xyz',
  linkedinHandle: 'maya-okonkwo',
  githubHandle: 'mayaokonkwo',
  twitter: 'mayaokonkwo',
  telegramHandle: 'mayaok',
  discordHandle: 'maya#4417',
  visibleHandles: ['email', 'linkedin', 'telegram', 'twitter', 'discord', 'github'],
  scheduleMeetingCount: 12,
  officeHours: 'https://cal.com/maya-okonkwo/15min',
  ohInterest: ['Verifiable compute', 'AI infra', 'Seed fundraising'],
  ohHelpWith: ['Go-to-market for infra', 'Hiring early eng', 'Tokenomics review'],
  bio: 'Building verifiable compute markets for AI training. Previously infrastructure lead at a top-5 cloud, where I ran the GPU scheduling team. Deep believer in open, auditable infrastructure for the next wave of AI. Currently raising a seed extension — happy to chat with infra-focused funds and technical operators.',
  skills: [
    { uid: 'sk1', title: 'Distributed Systems' },
    { uid: 'sk2', title: 'Machine Learning Infra' },
    { uid: 'sk3', title: 'Go-to-Market' },
    { uid: 'sk4', title: 'Fundraising' },
    { uid: 'sk5', title: 'Cryptography' },
  ],
  teams: [
    {
      id: 'lattice',
      name: 'Lattice Compute',
      role: 'Co-founder & CEO',
      logo: null,
      mainTeam: true,
    },
    {
      id: 'pl-research',
      name: 'PL Research Collective',
      role: 'Advisor',
      logo: null,
      mainTeam: false,
    },
  ],
  projectContributions: [
    {
      uid: 'pc1',
      projectUid: 'lattice-protocol',
      role: 'Co-founder & CEO',
      currentProject: true,
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: null,
      project: { name: 'Lattice Protocol', isDeleted: false, logo: null },
    },
    {
      uid: 'pc2',
      projectUid: 'gpu-mesh',
      role: 'Core Contributor',
      currentProject: false,
      startDate: '2022-03-01T00:00:00.000Z',
      endDate: '2023-11-01T00:00:00.000Z',
      project: { name: 'GPU Mesh (OSS)', isDeleted: false, logo: null },
    },
  ],
  repositories: [
    {
      name: 'lattice-core',
      description: 'Verifiable compute settlement layer and proving harness.',
      url: 'https://github.com/mayaokonkwo/lattice-core',
    },
    {
      name: 'gpu-scheduler',
      description: 'Fair-share GPU scheduler with preemption and bin-packing.',
      url: 'https://github.com/mayaokonkwo/gpu-scheduler',
    },
    {
      name: 'proof-bench',
      description: 'Benchmarks for zk proving systems on training workloads.',
      url: 'https://github.com/mayaokonkwo/proof-bench',
    },
  ],
};

export const MOCK_EXPERIENCE: FormattedMemberExperience[] = [
  {
    memberId: 'maya-okonkwo',
    company: 'Lattice Compute',
    title: 'Co-founder & CEO',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: new Date().toISOString(),
    isCurrent: true,
    location: 'Lisbon, Portugal',
    uid: 'exp1',
    isFlaggedByUser: false,
    description: '',
  },
  {
    memberId: 'maya-okonkwo',
    company: 'Hyperscale Cloud',
    title: 'Infrastructure Lead, GPU Scheduling',
    startDate: '2020-06-01T00:00:00.000Z',
    endDate: '2023-12-01T00:00:00.000Z',
    isCurrent: false,
    location: 'Remote',
    uid: 'exp2',
    isFlaggedByUser: false,
    description: '',
  },
  {
    memberId: 'maya-okonkwo',
    company: 'Stanford University',
    title: 'MS, Computer Science',
    startDate: '2017-09-01T00:00:00.000Z',
    endDate: '2019-06-01T00:00:00.000Z',
    isCurrent: false,
    location: 'Stanford, CA',
    uid: 'exp3',
    isFlaggedByUser: false,
    description: '',
  },
];

/* ---------------- Affinity relationship scenarios (the toggle) ---------------- */
export interface RelationshipScenario {
  key: string;
  label: string;
  empty?: boolean;
  relationship: AffinityRelationship;
}

const EMPTY_RELATIONSHIP: AffinityRelationship = {
  owner: { name: '', role: '', avatar: '' },
  lastContact: { when: '', date: '', channel: 'email', summary: '' },
  tier: 'neglected',
  windowMonths: 6,
  months: [
    { label: 'Jan', count: 0 },
    { label: 'Feb', count: 0 },
    { label: 'Mar', count: 0 },
    { label: 'Apr', count: 0 },
    { label: 'May', count: 0 },
    { label: 'Jun', count: 0 },
  ],
};

export const RELATIONSHIP_SCENARIOS: RelationshipScenario[] = [
  {
    key: 'active',
    label: 'High-touch',
    relationship: {
      owner: {
        name: 'Brad Holden',
        role: 'Partner, Network — Protocol Labs',
        avatar: '',
      },
      lastContact: {
        when: '3 days ago',
        date: 'Jun 22, 2026',
        channel: 'meeting',
        summary:
          'Intro call — walked through the seed-extension plan, current ARR and burn, and which infra-focused funds to prioritise for warm intros over the next few weeks.',
      },
      tier: 'high',
      windowMonths: 6,
      months: [
        { label: 'Jan', count: 1 },
        { label: 'Feb', count: 2 },
        { label: 'Mar', count: 2 },
        { label: 'Apr', count: 4 },
        { label: 'May', count: 3 },
        { label: 'Jun', count: 4 },
      ],
    },
  },
  {
    key: 'neglected',
    label: 'Neglected',
    relationship: {
      owner: {
        name: 'Brad Holden',
        role: 'Network Lead — Protocol Labs',
        avatar: '',
      },
      lastContact: {
        when: '4 months ago',
        date: 'Feb 18, 2026',
        channel: 'email',
        summary: 'Replied to testnet announcement — said she would follow up after the raise. No reply since.',
      },
      tier: 'neglected',
      windowMonths: 6,
      months: [
        { label: 'Jan', count: 1 },
        { label: 'Feb', count: 1 },
        { label: 'Mar', count: 0 },
        { label: 'Apr', count: 0 },
        { label: 'May', count: 0 },
        { label: 'Jun', count: 0 },
      ],
    },
  },
  {
    key: 'empty',
    label: 'Empty',
    empty: true,
    relationship: EMPTY_RELATIONSHIP,
  },
];

export function totalInteractions(months: MonthlyInteraction[]): number {
  return months.reduce((sum, m) => sum + m.count, 0);
}
