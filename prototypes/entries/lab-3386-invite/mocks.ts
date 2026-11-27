// Mock data only. Every name, team and link here is invented for the prototype.

export type Viewer = 'member' | 'team-lead' | 'admin';

export const VIEWERS: [Viewer, string][] = [
  ['member', 'Member'],
  ['team-lead', 'Team lead'],
  ['admin', 'Admin'],
];

/** The signed-in member who opens the menu and owns the invite link. */
export const MOCK_VIEWER = {
  uid: 'mock-viewer',
  name: 'Rowan Ellery',
  initials: 'RE',
  /** A per-member code, so the link is personal. Mocked; production would issue it. */
  inviteCode: 're-7f3k',
};

/** `.example` is a reserved domain, so the mock link can never reach a real site. */
export const MOCK_SIGN_UP_BASE = 'https://labos.example/sign-up';

/** The team on the team profile surface. The viewer leads it in the "Team lead" view. */
export const MOCK_TEAM = { id: 'mock-team-kestrel', name: 'Kestrel Works' };

/** The shape the production member cards read (MemberGridView, TeamMembersViewCard). */
export interface MockMember {
  id: string;
  name: string;
  role: string;
  teamLead: boolean;
  mainTeam: { id: string; name: string; role: string };
  teams: { id: string; name: string; role: string; mainTeam: boolean; teamLead: boolean }[];
  location: { city?: string; country?: string };
  skills: { uid: string; title: string }[];
  openToWork: boolean;
  officeHours: string | null;
  ohStatus: 'OK' | null;
  scheduleMeetingCount: number;
}

function member(
  id: string,
  name: string,
  role: string,
  teamName: string,
  teamLead: boolean,
  city: string,
  country: string,
  skills: string[],
): MockMember {
  const teamId = `mock-team-${teamName.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return {
    id,
    name,
    role,
    teamLead,
    mainTeam: { id: teamId, name: teamName, role },
    teams: [{ id: teamId, name: teamName, role, mainTeam: true, teamLead }],
    location: { city, country },
    skills: skills.map((title, i) => ({ uid: `${id}-s${i}`, title })),
    openToWork: false,
    officeHours: null,
    ohStatus: null,
    scheduleMeetingCount: 0,
  };
}

/** Members directory: the search runs over these names, teams and roles. */
export const MOCK_DIRECTORY: MockMember[] = [
  member('mock-m1', 'Ines Varga', 'Protocol Engineer', 'Kestrel Works', false, 'Lisbon', 'Portugal', [
    'Rust',
    'Networking',
  ]),
  member('mock-m2', 'Tomas Reyner', 'Founder', 'Halden Data', true, 'Berlin', 'Germany', ['Storage', 'Go']),
  member('mock-m3', 'Priya Navale', 'Research Lead', 'Ostrand Lab', true, 'Pune', 'India', ['Cryptography']),
  member('mock-m4', 'Leo Marchetti', 'Designer', 'Kestrel Works', false, 'Milan', 'Italy', [
    'Product Design',
    'Research',
  ]),
  member('mock-m5', 'Ada Okafor', 'Engineer', 'Halden Data', false, 'Lagos', 'Nigeria', ['TypeScript']),
  member('mock-m6', 'Mika Sund', 'Operations', 'Ostrand Lab', false, 'Oslo', 'Norway', ['Operations']),
];

/** A query that finds a member, and one that finds nobody (review band presets). */
export const QUERY_WITH_RESULTS = 'Kestrel';
export const QUERY_NO_RESULTS = 'Jordan Pell';

/** Members of the team on the team profile surface. */
export const MOCK_TEAM_MEMBERS: MockMember[] = MOCK_DIRECTORY.filter((m) => m.mainTeam.name === MOCK_TEAM.name).concat(
  member('mock-m7', MOCK_VIEWER.name, 'Team Lead', MOCK_TEAM.name, true, 'Dublin', 'Ireland', ['Leadership']),
);
