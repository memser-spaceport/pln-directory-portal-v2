import {
  MOCK_APPLICANTS,
  MOCK_INTERESTED,
  daysAgo,
  exp,
  type RoleApplicant,
  type RoleInterested,
} from '../team-profile/mocks';

/**
 * Who applied to the roles the board's owners see — the team profile's
 * applicants, plus Filecoin Foundation's.
 *
 * **Why the board needs its own.** The applicants page was built on the team
 * profile, whose prototype is Protocol Labs, so its records are keyed to
 * `pl-*`. The board's `team-lead` viewer leads Filecoin Foundation
 * (`LEAD_TEAM_UID`), and a count line that only ever appeared for the admin,
 * on one other team's card, would be a feature the default demo path cannot
 * render. These are the same record shape (`RoleApplicant`), for `ff-*`.
 *
 * `ff-3` is in review and has nobody: a listing that is not up yet cannot have
 * been applied to. `ff-4` was taken down and keeps the one person who applied
 * while it was live — an application does not disappear with its listing, on
 * this side either.
 *
 * One lookup for both hosts' data, so the board's count line and the page it
 * opens cannot disagree about who applied.
 */

const person = (
  p: Pick<RoleApplicant, 'id' | 'memberId' | 'name' | 'title' | 'team' | 'location' | 'email' | 'avatar' | 'skills'> & {
    bio: string;
    history: Array<[uid: string, title: string, company: string, start: string, end: string | null]>;
    cv?: boolean;
  },
): Omit<RoleApplicant, 'appliedAt' | 'note' | 'unseen' | 'reviewed'> => ({
  id: p.id,
  memberId: p.memberId,
  name: p.name,
  role: `${p.title} · ${p.team}`,
  title: p.title,
  team: p.team,
  location: p.location,
  email: p.email,
  avatar: p.avatar,
  cv: p.cv === false ? undefined : { name: `${p.memberId}-cv.pdf`, url: '#', size: 196608 },
  skills: p.skills,
  experience: p.history.map(([uid, title, company, start, end]) =>
    exp(p.memberId, uid, title, company, start, end, p.location),
  ),
  profile: {
    bio: `<p>${p.bio}</p>`,
    openToWork: true,
    linkedinHandle: p.memberId.replace('-', ''),
    teams: [{ id: p.team.toLowerCase().replace(/\s+/g, '-'), name: p.team, role: p.title, mainTeam: true }],
    contributions: [],
    repositories: [],
  },
});

const NOOR = person({
  id: 'ff-app-1',
  memberId: 'noor-haddad',
  name: 'Noor Haddad',
  title: 'Head of Partnerships',
  team: 'Fleek',
  location: 'New York, NY',
  email: 'noor@fleek.xyz',
  avatar: 'https://i.pravatar.cc/96?img=45',
  skills: ['Partnerships', 'Developer Ecosystems', 'Go-to-market'],
  bio: 'Partnerships lead for developer infrastructure. I have spent six years signing and then actually supporting the teams that build on a platform, which are two different jobs.',
  history: [
    ['nh1', 'Head of Partnerships', 'Fleek', '2022-04', null],
    ['nh2', 'Ecosystem Manager', 'Textile', '2019-01', '2022-03'],
  ],
});

const ELIAS = person({
  id: 'ff-app-2',
  memberId: 'elias-brandt',
  name: 'Elias Brandt',
  title: 'Developer Relations Lead',
  team: 'Chainsafe',
  location: 'Berlin, Germany',
  email: 'elias@chainsafe.io',
  avatar: 'https://i.pravatar.cc/96?img=12',
  skills: ['Developer Relations', 'Community', 'Technical Writing'],
  bio: 'DevRel lead with an engineering background. I run the programs that turn a first hackathon project into a team that is still shipping a year later.',
  history: [
    ['eb1', 'Developer Relations Lead', 'Chainsafe', '2021-09', null],
    ['eb2', 'Software Engineer', 'Chainsafe', '2018-06', '2021-08'],
  ],
});

const SOFIA = person({
  id: 'ff-app-3',
  memberId: 'sofia-marchetti',
  name: 'Sofia Marchetti',
  title: 'Growth Lead',
  team: 'Lattice Compute',
  location: 'Lisbon, Portugal',
  email: 'sofia@lattice.compute',
  avatar: 'https://i.pravatar.cc/96?img=47',
  skills: ['Growth', 'Ecosystem Strategy', 'Analytics'],
  bio: 'Growth lead for a compute network. Most of my work is finding which ten teams matter this quarter and making sure they get what they need from us.',
  history: [
    ['sm1', 'Growth Lead', 'Lattice Compute', '2023-01', null],
    ['sm2', 'Strategy Associate', 'Outlier Ventures', '2020-02', '2022-12'],
  ],
});

const TARIQ = person({
  id: 'ff-app-4',
  memberId: 'tariq-osei',
  name: 'Tariq Osei',
  title: 'Grants Manager',
  team: 'Gitcoin',
  location: 'Accra, Ghana',
  email: 'tariq@gitcoin.co',
  avatar: 'https://i.pravatar.cc/96?img=68',
  skills: ['Grants Operations', 'Program Management', 'Reporting'],
  bio: 'Grants manager. I have run four funding rounds end to end, from the brief to the milestone reports nobody enjoys chasing.',
  history: [
    ['to1', 'Grants Manager', 'Gitcoin', '2022-06', null],
    ['to2', 'Program Coordinator', 'Mozilla Foundation', '2019-03', '2022-05'],
  ],
});

const HANNA = person({
  id: 'ff-app-5',
  memberId: 'hanna-lindqvist',
  name: 'Hanna Lindqvist',
  title: 'Operations Manager',
  team: 'Textile',
  location: 'Stockholm, Sweden',
  email: 'hanna@textile.io',
  avatar: 'https://i.pravatar.cc/96?img=25',
  skills: ['Operations', 'Finance Ops', 'Process Design'],
  bio: 'Operations manager for a fifteen-person infrastructure team. I build the process once so the team stops rebuilding it every quarter.',
  history: [
    ['hl1', 'Operations Manager', 'Textile', '2021-02', null],
    ['hl2', 'Operations Analyst', 'Klarna', '2017-08', '2021-01'],
  ],
});

const MARCUS = person({
  id: 'ff-app-6',
  memberId: 'marcus-vale',
  name: 'Marcus Vale',
  title: 'Smart Contract Engineer',
  team: 'Glif',
  location: 'Remote',
  email: 'marcus@glif.io',
  avatar: 'https://i.pravatar.cc/96?img=59',
  skills: ['Solidity', 'FVM', 'Security Reviews'],
  bio: 'Smart contract engineer on the FVM since it launched. Mostly storage-market actors and the tooling around auditing them.',
  history: [
    ['mv1', 'Smart Contract Engineer', 'Glif', '2022-10', null],
    ['mv2', 'Blockchain Engineer', 'ConsenSys', '2019-05', '2022-09'],
  ],
});

const BOARD_APPLICANTS: Record<string, RoleApplicant[]> = {
  // Head of Ecosystem Growth
  'ff-1': [
    {
      ...NOOR,
      appliedAt: daysAgo(0, 3),
      note: 'I signed and supported most of the storage integrations Fleek ships today, so I know which Filecoin ecosystem teams are thriving and which are quietly stuck. I would start by talking to the stuck ones.',
      unseen: true,
      reviewed: false,
    },
    {
      ...ELIAS,
      appliedAt: daysAgo(1, 2),
      note: 'Ecosystem growth is what my DevRel work has turned into. I have both halves this role asks for: I can read the code a team is shipping and I can hold the conversation with its founder.',
      unseen: true,
      reviewed: false,
    },
    {
      ...SOFIA,
      appliedAt: daysAgo(4),
      note: 'I ran the same function at Lattice with a smaller ecosystem. Happy to share the scorecard we used to decide where support went. It is the part I would bring on day one.',
      unseen: false,
      reviewed: true,
    },
  ],
  // Grants Program Operations Lead
  'ff-2': [
    {
      ...TARIQ,
      appliedAt: daysAgo(2, 6),
      note: 'Four grant rounds at Gitcoin, end to end. The reporting side is where most programs fall over, and it is the part I have built tooling for.',
      unseen: true,
      reviewed: false,
    },
    {
      ...HANNA,
      appliedAt: daysAgo(6),
      note: 'I have not run grants specifically, but I have run the operations around a program of similar size. I would rather be direct about that than dress it up.',
      unseen: false,
      reviewed: false,
    },
  ],
  // Senior Smart Contract Engineer (FVM) — taken down; the application stays.
  'ff-4': [
    {
      ...MARCUS,
      appliedAt: daysAgo(24),
      note: 'Two years on FVM actors at Glif, most of it the storage-market contracts. I know the audit surface this role inherits.',
      unseen: false,
      reviewed: true,
    },
  ],
};

const BOARD_INTERESTED: Record<string, RoleInterested[]> = {
  'ff-1': [{ ...HANNA, id: 'ff-int-1', interestedAt: daysAgo(1, 8), unseen: true, reviewed: false }],
};

export const applicantsForRole = (roleUid: string): RoleApplicant[] =>
  BOARD_APPLICANTS[roleUid] ?? MOCK_APPLICANTS[roleUid] ?? [];

export const interestedForRole = (roleUid: string): RoleInterested[] =>
  BOARD_INTERESTED[roleUid] ?? MOCK_INTERESTED[roleUid] ?? [];
