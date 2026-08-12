// Mocked data for the person-city-calendar prototype.
//
// Member names / home cities are deliberately the same set used by the `members`
// and `member-profile` prototypes so the three read as one product.
//
// Dates are plain 'YYYY-MM-DD' strings, never Date objects — production parses
// them the same way (utils/irl.utils.ts `parseDateString`) precisely to avoid the
// UTC shift you get from `new Date('2026-08-24')`.

export type TripSource = 'manual' | 'event';

export interface Trip {
  id: string;
  memberId: string;
  city: string;
  country: string;
  /** inclusive, 'YYYY-MM-DD' */
  startDate: string;
  /** inclusive, 'YYYY-MM-DD' */
  endDate: string;
  source: TripSource;
  /** set when source === 'event' — the RSVP this trip was derived from */
  eventName?: string;
  note?: string;
  /** event-derived trips start unconfirmed: the user confirms rather than authors */
  confirmed: boolean;
}

export interface PersonCityMember {
  id: string;
  name: string;
  role: string;
  teamName: string;
  /** the declared home city — the base layer of the calendar */
  home: { city: string; country: string };
  following: boolean;
  teamLead: boolean;
  openToWork: boolean;
  officeHours: string | null;
  scheduleMeetingCount: number;
  skills: { title: string }[];
}

/** The viewer. */
export const ME_ID = 'maya-okonkwo';

/** "Today" for the prototype — fixed so screenshots are stable. */
export const TODAY = '2026-08-06';

export const MOCK_PEOPLE: PersonCityMember[] = [
  {
    id: 'maya-okonkwo',
    name: 'Maya Okonkwo',
    role: 'Co-founder & CEO',
    teamName: 'Lattice Compute',
    home: { city: 'Lisbon', country: 'Portugal' },
    following: false,
    teamLead: true,
    openToWork: true,
    officeHours: 'https://cal.com/maya',
    scheduleMeetingCount: 12,
    skills: [{ title: 'Distributed Systems' }, { title: 'ML Infra' }, { title: 'Fundraising' }],
  },
  {
    id: 'theo-larsson',
    name: 'Theo Larsson',
    role: 'Founder',
    teamName: 'Driftless Labs',
    home: { city: 'Berlin', country: 'Germany' },
    following: true,
    teamLead: false,
    openToWork: false,
    officeHours: null,
    scheduleMeetingCount: 1,
    skills: [{ title: 'Decentralized Storage' }, { title: 'Rust' }],
  },
  {
    id: 'lucas-moreau',
    name: 'Lucas Moreau',
    role: 'Head of Product',
    teamName: 'Protocol Labs',
    home: { city: 'Paris', country: 'France' },
    following: true,
    teamLead: true,
    openToWork: false,
    officeHours: 'https://cal.com/lucas',
    scheduleMeetingCount: 9,
    skills: [{ title: 'Product Strategy' }, { title: 'IPFS' }],
  },
  {
    id: 'nadia-haddad',
    name: 'Nadia Haddad',
    role: 'Partner',
    teamName: 'Meridian Ventures',
    home: { city: 'Dubai', country: 'UAE' },
    following: true,
    teamLead: false,
    openToWork: false,
    officeHours: 'https://cal.com/nadia',
    scheduleMeetingCount: 3,
    skills: [{ title: 'Seed Investing' }, { title: 'Infra' }],
  },
  {
    id: 'sofia-rossi',
    name: 'Sofia Rossi',
    role: 'Design Lead',
    teamName: 'Station',
    home: { city: 'Milan', country: 'Italy' },
    following: true,
    teamLead: true,
    openToWork: true,
    officeHours: 'https://cal.com/sofia',
    scheduleMeetingCount: 6,
    skills: [{ title: 'Product Design' }, { title: 'Design Systems' }],
  },
  {
    id: 'olga-petrova',
    name: 'Olga Petrova',
    role: 'Data Scientist',
    teamName: 'OSO',
    home: { city: 'Warsaw', country: 'Poland' },
    following: true,
    teamLead: false,
    openToWork: true,
    officeHours: 'https://cal.com/olga',
    scheduleMeetingCount: 5,
    skills: [{ title: 'Data Science' }, { title: 'Impact Metrics' }],
  },
  {
    id: 'marcus-bell',
    name: 'Marcus Bell',
    role: 'Community Lead',
    teamName: 'Protocol Labs',
    home: { city: 'Austin', country: 'USA' },
    following: true,
    teamLead: false,
    openToWork: false,
    officeHours: 'https://cal.com/marcus',
    scheduleMeetingCount: 11,
    skills: [{ title: 'Community' }, { title: 'Events' }],
  },
  {
    id: 'fatima-zahra',
    name: 'Fatima Zahra',
    role: 'Founder & CTO',
    teamName: 'Helia Systems',
    home: { city: 'Casablanca', country: 'Morocco' },
    following: true,
    teamLead: true,
    openToWork: false,
    officeHours: 'https://cal.com/fatima',
    scheduleMeetingCount: 4,
    skills: [{ title: 'Edge Compute' }, { title: 'Systems' }],
  },
  {
    id: 'amara-singh',
    name: 'Amara Singh',
    role: 'Protocol Engineer',
    teamName: 'Filecoin Foundation',
    home: { city: 'Bangalore', country: 'India' },
    following: false,
    teamLead: false,
    openToWork: true,
    officeHours: 'https://cal.com/amara',
    scheduleMeetingCount: 7,
    skills: [{ title: 'Cryptography' }, { title: 'Consensus' }],
  },
  {
    id: 'david-chen',
    name: 'David Chen',
    role: 'Smart Contract Engineer',
    teamName: 'Spark Protocol',
    home: { city: 'Singapore', country: 'Singapore' },
    following: false,
    teamLead: false,
    openToWork: false,
    officeHours: null,
    scheduleMeetingCount: 2,
    skills: [{ title: 'Solidity' }, { title: 'Security' }],
  },
  {
    id: 'kenji-watanabe',
    name: 'Kenji Watanabe',
    role: 'Research Scientist',
    teamName: 'CryptoNet',
    home: { city: 'Tokyo', country: 'Japan' },
    following: false,
    teamLead: false,
    openToWork: true,
    officeHours: null,
    scheduleMeetingCount: 0,
    skills: [{ title: 'Zero Knowledge' }, { title: 'Math' }],
  },
  {
    id: 'james-oneill',
    name: "James O'Neill",
    role: 'Growth Engineer',
    teamName: 'Tableland',
    home: { city: 'Dublin', country: 'Ireland' },
    following: false,
    teamLead: false,
    openToWork: true,
    officeHours: null,
    scheduleMeetingCount: 0,
    skills: [{ title: 'Growth' }, { title: 'Analytics' }],
  },
];

/**
 * Trips for everyone, including the viewer.
 *
 * The viewer's event-derived trips (`source: 'event'`, `confirmed: false`) are the
 * point of the prototype: on first visit the calendar is already mostly right,
 * because the network already knows where you RSVP'd.
 */
export const MOCK_TRIPS: Trip[] = [
  // ---- Me ----
  {
    id: 't-me-berlin',
    memberId: 'maya-okonkwo',
    city: 'Berlin',
    country: 'Germany',
    startDate: '2026-08-24',
    endDate: '2026-08-28',
    source: 'event',
    eventName: 'Protocol Berg',
    confirmed: false,
  },
  {
    id: 't-me-sf',
    memberId: 'maya-okonkwo',
    city: 'San Francisco',
    country: 'USA',
    startDate: '2026-09-07',
    endDate: '2026-09-11',
    source: 'manual',
    note: 'Fundraising meetings — open for coffee',
    confirmed: true,
  },
  {
    id: 't-me-singapore',
    memberId: 'maya-okonkwo',
    city: 'Singapore',
    country: 'Singapore',
    startDate: '2026-10-05',
    endDate: '2026-10-09',
    source: 'event',
    eventName: 'FIL Dev Summit',
    confirmed: false,
  },

  // ---- Berlin, late Aug (overlaps with me) ----
  {
    id: 't-lucas-berlin',
    memberId: 'lucas-moreau',
    city: 'Berlin',
    country: 'Germany',
    startDate: '2026-08-25',
    endDate: '2026-08-27',
    source: 'event',
    eventName: 'Protocol Berg',
    confirmed: true,
  },
  {
    id: 't-nadia-berlin',
    memberId: 'nadia-haddad',
    city: 'Berlin',
    country: 'Germany',
    startDate: '2026-08-24',
    endDate: '2026-08-26',
    source: 'event',
    eventName: 'Protocol Berg',
    confirmed: true,
  },
  {
    id: 't-olga-berlin',
    memberId: 'olga-petrova',
    city: 'Berlin',
    country: 'Germany',
    startDate: '2026-08-26',
    endDate: '2026-08-30',
    source: 'manual',
    note: 'Team offsite',
    confirmed: true,
  },
  // Theo lives in Berlin — no trip needed, his home city produces the overlap.

  // ---- San Francisco, early Sept (overlaps with me) ----
  {
    id: 't-sofia-sf',
    memberId: 'sofia-rossi',
    city: 'San Francisco',
    country: 'USA',
    startDate: '2026-09-08',
    endDate: '2026-09-12',
    source: 'manual',
    note: 'Design systems summit',
    confirmed: true,
  },
  {
    id: 't-marcus-sf',
    memberId: 'marcus-bell',
    city: 'San Francisco',
    country: 'USA',
    startDate: '2026-09-07',
    endDate: '2026-09-10',
    source: 'manual',
    confirmed: true,
  },

  // ---- Lisbon, mid Sept — they come to me while I'm home ----
  {
    id: 't-fatima-lisbon',
    memberId: 'fatima-zahra',
    city: 'Lisbon',
    country: 'Portugal',
    startDate: '2026-09-14',
    endDate: '2026-09-18',
    source: 'event',
    eventName: 'LabWeek Lisbon',
    confirmed: true,
  },
  {
    id: 't-james-lisbon',
    memberId: 'james-oneill',
    city: 'Lisbon',
    country: 'Portugal',
    startDate: '2026-09-14',
    endDate: '2026-09-19',
    source: 'event',
    eventName: 'LabWeek Lisbon',
    confirmed: true,
  },

  // ---- Singapore, early Oct (overlaps with me) ----
  {
    id: 't-amara-singapore',
    memberId: 'amara-singh',
    city: 'Singapore',
    country: 'Singapore',
    startDate: '2026-10-04',
    endDate: '2026-10-09',
    source: 'event',
    eventName: 'FIL Dev Summit',
    confirmed: true,
  },
  // David lives in Singapore — home city produces the overlap.

  // ---- Non-overlapping travel, so the matrix isn't all about me ----
  {
    id: 't-kenji-seoul',
    memberId: 'kenji-watanabe',
    city: 'Seoul',
    country: 'South Korea',
    startDate: '2026-08-17',
    endDate: '2026-08-21',
    source: 'manual',
    confirmed: true,
  },
  {
    id: 't-theo-amsterdam',
    memberId: 'theo-larsson',
    city: 'Amsterdam',
    country: 'Netherlands',
    startDate: '2026-09-01',
    endDate: '2026-09-04',
    source: 'manual',
    confirmed: true,
  },
];

/** Cities offered by the trip editor's combobox. Static — no geocoding service. */
export const CITY_OPTIONS: { city: string; country: string }[] = [
  { city: 'Amsterdam', country: 'Netherlands' },
  { city: 'Austin', country: 'USA' },
  { city: 'Bangalore', country: 'India' },
  { city: 'Bangkok', country: 'Thailand' },
  { city: 'Barcelona', country: 'Spain' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Bogotá', country: 'Colombia' },
  { city: 'Boston', country: 'USA' },
  { city: 'Brussels', country: 'Belgium' },
  { city: 'Buenos Aires', country: 'Argentina' },
  { city: 'Cape Town', country: 'South Africa' },
  { city: 'Casablanca', country: 'Morocco' },
  { city: 'Chicago', country: 'USA' },
  { city: 'Denver', country: 'USA' },
  { city: 'Dubai', country: 'UAE' },
  { city: 'Dublin', country: 'Ireland' },
  { city: 'Helsinki', country: 'Finland' },
  { city: 'Istanbul', country: 'Türkiye' },
  { city: 'Lagos', country: 'Nigeria' },
  { city: 'Lisbon', country: 'Portugal' },
  { city: 'London', country: 'United Kingdom' },
  { city: 'Los Angeles', country: 'USA' },
  { city: 'Madrid', country: 'Spain' },
  { city: 'Mexico City', country: 'Mexico' },
  { city: 'Miami', country: 'USA' },
  { city: 'Milan', country: 'Italy' },
  { city: 'Nairobi', country: 'Kenya' },
  { city: 'New York', country: 'USA' },
  { city: 'Paris', country: 'France' },
  { city: 'Prague', country: 'Czechia' },
  { city: 'San Francisco', country: 'USA' },
  { city: 'São Paulo', country: 'Brazil' },
  { city: 'Seattle', country: 'USA' },
  { city: 'Seoul', country: 'South Korea' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Taipei', country: 'Taiwan' },
  { city: 'Tel Aviv', country: 'Israel' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Vancouver', country: 'Canada' },
  { city: 'Warsaw', country: 'Poland' },
  { city: 'Zurich', country: 'Switzerland' },
];

/**
 * Extra profile fields the real member-detail components read. Shaped so the
 * mock can be cast to IMember and handed straight to production components,
 * the same trick the `member-profile` prototype uses.
 */
export const PROFILE_EXTRAS: Record<
  string,
  { bio: string; ohInterest: string[]; ohHelpWith: string[]; officeHoursNote: string }
> = {
  'maya-okonkwo': {
    bio: 'Building verifiable compute markets on top of Filecoin. Previously infra at a hyperscaler; now trying to make proof generation cheap enough that nobody thinks about it.',
    ohInterest: ['Proof systems', 'GPU markets', 'Seed fundraising'],
    ohHelpWith: ['Distributed systems design', 'Hiring your first infra engineer'],
    officeHoursNote: 'is available for a short 1:1 call to connect or help — no introduction needed.',
  },
  'lucas-moreau': {
    bio: 'Head of Product at Protocol Labs. IPFS maintainer. Interested in how protocol teams decide what not to build.',
    ohInterest: ['Product strategy', 'Developer experience'],
    ohHelpWith: ['Roadmapping', 'Positioning a protocol product'],
    officeHoursNote: 'is happy to talk product strategy with teams building on IPFS.',
  },
};

/**
 * The rest of what /members/[id] renders. Shaped to the fields the production
 * section components read, so the mock can be cast to IMember and handed to
 * `TeamsList`, `ContributionsList` and `ExperiencesList` directly — the same
 * trick the `member-profile` prototype uses.
 */
export const PROFILE_SECTIONS: Record<string, any> = {
  'maya-okonkwo': {
    email: 'maya@latticecompute.xyz',
    linkedinHandle: 'maya-okonkwo',
    githubHandle: 'mayaokonkwo',
    twitter: 'mayaokonkwo',
    telegramHandle: 'mayaok',
    discordHandle: 'maya#4417',
    teams: [
      { id: 'lattice', uid: 'lattice', name: 'Lattice Compute', role: 'Co-founder & CEO', logo: null, mainTeam: true },
      {
        id: 'pl-research',
        uid: 'pl-research',
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
        name: 'proof-bench',
        description: 'Benchmarks for GPU proving across circuit families.',
        url: 'https://github.com/mayaokonkwo/proof-bench',
      },
    ],
    forumThreads: [
      { title: 'What actually makes proving cheap?', replies: 14, when: '3 days ago' },
      { title: 'Seed extensions in infra — what are you seeing?', replies: 6, when: '2 weeks ago' },
    ],
  },
  'lucas-moreau': {
    email: 'lucas@protocol.ai',
    linkedinHandle: 'lucas-moreau',
    githubHandle: 'lmoreau',
    twitter: 'lucasmoreau',
    telegramHandle: 'lucasm',
    discordHandle: 'lucas#2210',
    teams: [
      { id: 'pl', uid: 'pl', name: 'Protocol Labs', role: 'Head of Product', logo: null, mainTeam: true },
      { id: 'ipfs', uid: 'ipfs', name: 'IPFS', role: 'Maintainer', logo: null, mainTeam: false },
    ],
    projectContributions: [
      {
        uid: 'pc3',
        projectUid: 'ipfs',
        role: 'Maintainer',
        currentProject: true,
        startDate: '2021-06-01T00:00:00.000Z',
        endDate: null,
        project: { name: 'IPFS', isDeleted: false, logo: null },
      },
    ],
    repositories: [{ name: 'kubo', description: 'IPFS implementation in Go.', url: 'https://github.com/ipfs/kubo' }],
    forumThreads: [{ title: 'Deciding what not to build', replies: 22, when: '1 week ago' }],
  },
};

/** Experience rows for the Experience section. */
export const PROFILE_EXPERIENCE: Record<string, any[]> = {
  'maya-okonkwo': [
    {
      uid: 'ex1',
      title: 'Co-founder & CEO',
      company: 'Lattice Compute',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: null,
      currentTeam: true,
      description: 'Verifiable compute markets for AI training.',
      location: 'Lisbon, Portugal',
    },
    {
      uid: 'ex2',
      title: 'Infrastructure Lead',
      company: 'Northwind Cloud',
      startDate: '2019-04-01T00:00:00.000Z',
      endDate: '2023-12-01T00:00:00.000Z',
      currentTeam: false,
      description: 'Ran the GPU scheduling team.',
      location: 'Berlin, Germany',
    },
  ],
  'lucas-moreau': [
    {
      uid: 'ex3',
      title: 'Head of Product',
      company: 'Protocol Labs',
      startDate: '2021-06-01T00:00:00.000Z',
      endDate: null,
      currentTeam: true,
      description: 'Product for the IPFS stack.',
      location: 'Paris, France',
    },
  ],
};

/** Gathering shown on the Gathering tab. */
export const GATHERING = {
  name: 'Protocol Berg',
  city: 'Berlin',
  location: 'Berlin, Germany',
  startDate: '2026-08-24',
  endDate: '2026-08-28',
  eventCount: 6,
  attendeeCount: 148,
  description:
    'A week of protocol engineering in Berlin — six events across storage, consensus and cryptography, plus whatever happens in between.',
  subEvents: ['Protocol Berg — Main', 'Storage Day', 'ZK Sessions'],
};

/**
 * Visibility groups. Rendered but disabled everywhere — the user explicitly
 * deferred building privacy, so this only fixes the *shape* so it isn't
 * retrofitted later.
 */
export const VISIBILITY_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'network', label: 'My teams & direct relationships' },
  { value: 'pl', label: 'PL Infra only' },
] as const;

/**
 * The cold start.
 *
 * Someone who just joined: no location, no role, no RSVPs. This is the case the
 * rest of the prototype flatters — everywhere else the calendar arrives ~60%
 * filled from event attendance, and "confirm, don't author" carries the
 * interaction. Here there is nothing to confirm, so the field has to stand up on
 * its own. Deliberately not in MOCK_PEOPLE: an empty home city has no meaning in
 * the presence index or the directory grid.
 */
export const NEW_MEMBER: PersonCityMember = {
  id: 'priya-raman',
  name: 'Priya Raman',
  role: '',
  teamName: '',
  home: { city: '', country: '' },
  following: false,
  teamLead: false,
  openToWork: false,
  officeHours: null,
  scheduleMeetingCount: 0,
  skills: [],
};

/** What a day-one profile actually has in it: an email, and nothing else. */
export const NEW_MEMBER_EXTRAS = {
  bio: '',
  ohInterest: [] as string[],
  ohHelpWith: [] as string[],
  officeHoursNote: '',
};

export const NEW_MEMBER_SECTIONS = {
  email: 'priya@example.com',
  linkedinHandle: '',
  githubHandle: '',
  twitter: '',
  telegramHandle: '',
  discordHandle: '',
  teams: [],
  projectContributions: [],
  repositories: [],
  forumThreads: [],
};

// Registered so /members/[id] resolves them like any other member.
PROFILE_EXTRAS[NEW_MEMBER.id] = NEW_MEMBER_EXTRAS;
PROFILE_SECTIONS[NEW_MEMBER.id] = NEW_MEMBER_SECTIONS;
PROFILE_EXPERIENCE[NEW_MEMBER.id] = [];

/**
 * Options for the two production selects inside Edit Profile Details.
 * In dev these come from `useMemberFormOptions` (react-query); here they are
 * static so the real `FormMultiSelect` / `FormSelect` can be imported unchanged.
 */
export const SKILL_OPTIONS = [
  'Distributed Systems',
  'ML Infra',
  'Fundraising',
  'Decentralized Storage',
  'Rust',
  'Cryptography',
  'Protocol Design',
  'Product',
  'Developer Relations',
  'Go',
].map((title) => ({ value: title, label: title }));

export const TEAM_OPTIONS = [
  'Lattice Compute',
  'Driftless Labs',
  'Northwind Systems',
  'Protocol Labs',
  'Cassava Research',
].map((name) => ({ value: name.toLowerCase().replace(/\s+/g, '-'), label: name }));
