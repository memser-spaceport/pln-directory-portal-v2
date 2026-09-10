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
      // null, not 'jobs@protocol.ai': a team-configured inbox hides the refer
      // modal's whole "Send to" picker (the send skips recipients), so the one
      // team every demo leads with was the one team that never showed the
      // suggested-recipients design. The inbox branch still exists in the modal —
      // put an address back here to demo it.
      jobReferEmail: null,
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
      jobReferEmail: null,
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
      jobReferEmail: null,
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
      jobReferEmail: null,
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
      jobReferEmail: null,
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
      jobReferEmail: null,
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

/**
 * Who reads an application, per hiring team.
 *
 * **Stranded in this folder.** The apply-steps and profile-step copies consume
 * this through their mock-backed `useTeamMembers`; here the hook must stay on the
 * live directory lookup, because production's jobs page imports it from this tree
 * (`components/page/jobs/JobApplicationPane`) — so nothing in this folder reads
 * this constant. Kept so the three folders' mocks stay diffable.
 *
 * **Why this is mocked rather than looked up.** It used to be neither: the apply
 * flow's facepile and the referral modal's prefill both came from
 * `useTeamMembers`, which makes two *real* calls to the directory API
 * (`searchTeamsByName` → `getMembersForProjectForm`). That broke the folder's
 * first rule — mocked data only, no `services/`, no react-query — and it broke
 * it in the way that costs the most: `DIRECTORY_API_URL` is inlined at build
 * time, and the `pln-prototypes` deployment doesn't set it, so on the shared
 * link every one of those calls resolved to `/prototypes/undefined/v1/teams…`
 * and 404'd. The facepile renders nothing when the lookup is empty — by design,
 * because a name that isn't there yet is worse than no name — so the reviewers
 * the link exists for were the only people who never saw it.
 *
 * Names are invented, like every other name on this board (`Lattice Compute`,
 * `Meridian Labs`). The live lookup returned real directory members, which is
 * fine for a signed-in member reading their own network and wrong for a mock
 * anyone can open.
 *
 * No `image`: `MemberAvatar` falls back to `getDefaultAvatar(name)`, production's
 * DiceBear helper, which returns a deterministic data-URI. So these render as
 * distinct avatars with nothing fetched.
 *
 * Two or three each, because that is what a facepile is for — the apply pane caps
 * at three and counts the rest, and a team of thirty reads as a directory rather
 * than as the people who will read your letter.
 */
export const MOCK_HIRING_TEAMS: Record<string, Array<{ uid: string; name: string; title: string }>> = {
  'Protocol Labs': [
    { uid: 'pl-lead-1', name: 'Anneke Roos', title: 'Head of Engineering' },
    { uid: 'pl-lead-2', name: 'Tomas Ferreira', title: 'Engineering Manager' },
    { uid: 'pl-lead-3', name: 'Priya Raghavan', title: 'Talent Lead' },
    { uid: 'pl-lead-4', name: 'Sam Okonkwo', title: 'Principal Engineer' },
  ],
  'Filecoin Foundation': [
    { uid: 'ff-lead-1', name: 'Clara Nystrom', title: 'Ecosystem Director' },
    { uid: 'ff-lead-2', name: 'Hunter Delacroix', title: 'Head of Programs' },
    { uid: 'ff-lead-3', name: 'Marta Bellini', title: 'Operations Lead' },
  ],
  libp2p: [
    { uid: 'lp-lead-1', name: 'Jonas Wexler', title: 'Maintainer' },
    { uid: 'lp-lead-2', name: 'Ines Cardoso', title: 'Core Developer' },
  ],
  'IPFS Collective': [
    { uid: 'ipfs-lead-1', name: 'Dara Osei', title: 'Project Lead' },
    { uid: 'ipfs-lead-2', name: 'Nils Ahlberg', title: 'Community Lead' },
  ],
  drand: [
    { uid: 'dr-lead-1', name: 'Yuki Tanabe', title: 'Research Lead' },
    { uid: 'dr-lead-2', name: 'Emil Vasquez', title: 'Protocol Engineer' },
  ],
  Bacalhau: [
    { uid: 'bac-lead-1', name: 'Rosa Lindqvist', title: 'Founding Engineer' },
    { uid: 'bac-lead-2', name: 'Amir Haddad', title: 'Head of Product' },
  ],
};
