import type { IJobRole, IJobTeam, IJobTeamGroup, IJobsFacetItem } from '@/types/jobs.types';

// Dates are generated relative to "now" so the "New" badge + "Nd ago" labels stay
// live. Safe because the prototype only renders after mount (client-side) — see the
// mount gate in JobBoardPrototype.tsx — so there's no SSR/CSR hydration mismatch.
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

type MockRole = Omit<IJobRole, 'lastUpdated' | 'postedDate' | 'detectionDate'> & { ageDays: number };

function role(r: MockRole): IJobRole {
  const { ageDays, ...rest } = r;
  const iso = daysAgo(ageDays);
  return { ...rest, postedDate: iso, detectionDate: iso, lastUpdated: iso };
}

interface MockGroup {
  team: IJobTeam;
  roles: MockRole[];
}

const MOCK_GROUPS: MockGroup[] = [
  {
    team: {
      uid: 'protocol-labs',
      name: 'Protocol Labs',
      logoUrl: null,
      focusAreas: ['Infrastructure', 'Networking', 'Storage'],
      subFocusAreas: ['Networking'],
    },
    roles: [
      {
        uid: 'pl-1',
        roleTitle: 'Senior Distributed Systems Engineer',
        roleCategory: 'Engineering',
        seniority: 'Senior (L4)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: 'https://example.com/apply/pl-1',
        ageDays: 2,
      },
      {
        uid: 'pl-2',
        roleTitle: 'Product Manager, Developer Tools',
        roleCategory: 'Product',
        seniority: 'Lead (L5)',
        location: ['San Francisco, CA', 'Remote'],
        workMode: 'hybrid',
        applyUrl: 'https://example.com/apply/pl-2',
        ageDays: 5,
      },
      {
        uid: 'pl-3',
        roleTitle: 'Protocol Researcher',
        roleCategory: 'Research',
        seniority: 'Principal+ (L6-L7)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: 'https://example.com/apply/pl-3',
        ageDays: 12,
      },
      {
        uid: 'pl-4',
        roleTitle: 'Staff Security Engineer',
        roleCategory: 'Engineering',
        seniority: 'Principal+ (L6-L7)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: 'https://example.com/apply/pl-4',
        ageDays: 24,
      },
    ],
  },
  {
    team: {
      uid: 'filecoin-foundation',
      name: 'Filecoin Foundation',
      logoUrl: null,
      focusAreas: ['Storage', 'Governance'],
      subFocusAreas: [],
    },
    roles: [
      {
        uid: 'ff-1',
        roleTitle: 'Head of Ecosystem Growth',
        roleCategory: 'Business Development',
        seniority: 'Lead (L5)',
        location: ['New York, NY'],
        workMode: 'in-office',
        applyUrl: 'https://example.com/apply/ff-1',
        ageDays: 1,
      },
      {
        uid: 'ff-2',
        roleTitle: 'Grants Program Operations Lead',
        roleCategory: 'Operations',
        seniority: 'Senior (L4)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: 'https://example.com/apply/ff-2',
        ageDays: 9,
      },
    ],
  },
  {
    team: {
      uid: 'libp2p',
      name: 'libp2p',
      logoUrl: null,
      focusAreas: ['Infrastructure', 'Networking'],
      subFocusAreas: ['Networking'],
    },
    roles: [
      {
        uid: 'lp-1',
        roleTitle: 'Networking Engineer (Go)',
        roleCategory: 'Engineering',
        seniority: 'Mid (L3)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: 'https://example.com/apply/lp-1',
        ageDays: 3,
      },
      {
        uid: 'lp-2',
        roleTitle: 'Developer Advocate',
        roleCategory: 'Marketing',
        seniority: 'Mid (L3)',
        location: ['Berlin, Germany', 'Remote'],
        workMode: 'hybrid',
        applyUrl: 'https://example.com/apply/lp-2',
        ageDays: 30,
      },
    ],
  },
  {
    team: {
      uid: 'ipfs-collective',
      name: 'IPFS Collective',
      logoUrl: null,
      focusAreas: ['Infrastructure', 'Storage'],
      subFocusAreas: [],
    },
    roles: [
      {
        uid: 'ipfs-1',
        roleTitle: 'Product Designer',
        roleCategory: 'Design',
        seniority: 'Senior (L4)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: 'https://example.com/apply/ipfs-1',
        ageDays: 4,
      },
      {
        uid: 'ipfs-2',
        roleTitle: 'Frontend Engineer',
        roleCategory: 'Engineering',
        seniority: 'Junior (L1-L2)',
        location: ['Lisbon, Portugal'],
        workMode: 'in-office',
        applyUrl: 'https://example.com/apply/ipfs-2',
        ageDays: 18,
      },
    ],
  },
  {
    team: {
      uid: 'drand',
      name: 'drand',
      logoUrl: null,
      focusAreas: ['Cryptography', 'Infrastructure'],
      subFocusAreas: [],
    },
    roles: [
      {
        uid: 'drand-1',
        roleTitle: 'Applied Cryptography Engineer',
        roleCategory: 'Engineering',
        seniority: 'Senior (L4)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: 'https://example.com/apply/drand-1',
        ageDays: 6,
      },
    ],
  },
  {
    team: {
      uid: 'bacalhau',
      name: 'Bacalhau',
      logoUrl: null,
      focusAreas: ['Compute', 'Infrastructure'],
      subFocusAreas: [],
    },
    roles: [
      {
        uid: 'bac-1',
        roleTitle: 'Founding Backend Engineer',
        roleCategory: 'Engineering',
        seniority: 'Lead (L5)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: 'https://example.com/apply/bac-1',
        ageDays: 1,
      },
      {
        uid: 'bac-2',
        roleTitle: 'Technical Program Manager',
        roleCategory: 'Product',
        seniority: 'Senior (L4)',
        location: ['London, UK', 'Remote'],
        workMode: 'hybrid',
        applyUrl: 'https://example.com/apply/bac-2',
        ageDays: 40,
      },
    ],
  },
];

export const MOCK_JOB_GROUPS: IJobTeamGroup[] = MOCK_GROUPS.map((g) => {
  const roles = g.roles.map(role);
  return { team: g.team, roles, totalRoles: roles.length };
});

// Facet mocks for the filter rail. Counts are illustrative — the prototype
// recomputes visible groups locally, it doesn't read these counts to filter.
export const MOCK_ROLE_CATEGORY_FACETS: IJobsFacetItem[] = [
  { value: 'Engineering', count: 6 },
  { value: 'Product', count: 3 },
  { value: 'Research', count: 1 },
  { value: 'Design', count: 1 },
  { value: 'Operations', count: 1 },
  { value: 'Marketing', count: 1 },
  { value: 'Business Development', count: 1 },
];

export const MOCK_SENIORITY_FACETS: IJobsFacetItem[] = [
  { value: 'Junior (L1-L2)', count: 1 },
  { value: 'Mid (L3)', count: 2 },
  { value: 'Senior (L4)', count: 5 },
  { value: 'Lead (L5)', count: 3 },
  { value: 'Principal+ (L6-L7)', count: 2 },
];

export const MOCK_WORKMODE_FACETS: IJobsFacetItem[] = [
  { value: 'remote', count: 8 },
  { value: 'in-office', count: 2 },
  { value: 'hybrid', count: 3 },
];

export const MOCK_LOCATION_FACETS: IJobsFacetItem[] = [
  { value: 'Remote', count: 8 },
  { value: 'San Francisco, CA', count: 1 },
  { value: 'New York, NY', count: 1 },
  { value: 'Berlin, Germany', count: 1 },
  { value: 'Lisbon, Portugal', count: 1 },
  { value: 'London, UK', count: 1 },
];
