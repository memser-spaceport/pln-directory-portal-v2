// Mocked member list for the members listing prototype.
// Shapes mirror the IMember fields the production member cards read, so the real
// MemberGridView / MemberListView components render straight from this data.

export interface MockListMember {
  id: string;
  name: string;
  profile?: string;
  role: string;
  mainTeam: { name: string; role: string };
  teams: { name: string; role: string; mainTeam: boolean }[];
  location: { city?: string; country?: string; metroArea?: string; region?: string };
  teamLead: boolean;
  openToWork: boolean;
  scheduleMeetingCount: number;
  officeHours: string | null;
  ohStatus: 'OK' | null;
  skills: { title: string }[];
}

function team(name: string, role: string): { name: string; role: string; mainTeam: boolean } {
  return { name, role, mainTeam: true };
}

export const MOCK_MEMBERS: MockListMember[] = [
  {
    id: 'maya-okonkwo',
    name: 'Maya Okonkwo',
    role: 'Co-founder & CEO',
    mainTeam: { name: 'Lattice Compute', role: 'Co-founder & CEO' },
    teams: [team('Lattice Compute', 'Co-founder & CEO'), { name: 'PL Research Collective', role: 'Advisor', mainTeam: false }],
    location: { city: 'Lisbon', country: 'Portugal' },
    teamLead: true,
    openToWork: true,
    scheduleMeetingCount: 12,
    officeHours: 'https://cal.com/maya',
    ohStatus: 'OK',
    skills: [{ title: 'Distributed Systems' }, { title: 'ML Infra' }, { title: 'Fundraising' }, { title: 'Go-to-Market' }],
  },
  {
    id: 'theo-larsson',
    name: 'Theo Larsson',
    role: 'Founder',
    mainTeam: { name: 'Driftless Labs', role: 'Founder' },
    teams: [team('Driftless Labs', 'Founder')],
    location: { city: 'Berlin', country: 'Germany' },
    teamLead: false,
    openToWork: false,
    scheduleMeetingCount: 1,
    officeHours: null,
    ohStatus: null,
    skills: [{ title: 'Decentralized Storage' }, { title: 'Rust' }, { title: 'Research' }],
  },
  {
    id: 'amara-singh',
    name: 'Amara Singh',
    role: 'Protocol Engineer',
    mainTeam: { name: 'Filecoin Foundation', role: 'Protocol Engineer' },
    teams: [team('Filecoin Foundation', 'Protocol Engineer')],
    location: { city: 'Bangalore', country: 'India' },
    teamLead: false,
    openToWork: true,
    scheduleMeetingCount: 7,
    officeHours: 'https://cal.com/amara',
    ohStatus: 'OK',
    skills: [{ title: 'Cryptography' }, { title: 'Go' }, { title: 'Consensus' }],
  },
  {
    id: 'lucas-moreau',
    name: 'Lucas Moreau',
    role: 'Head of Product',
    mainTeam: { name: 'Protocol Labs', role: 'Head of Product' },
    teams: [team('Protocol Labs', 'Head of Product'), { name: 'IPFS', role: 'Maintainer', mainTeam: false }, { name: 'libp2p', role: 'Contributor', mainTeam: false }],
    location: { city: 'Paris', country: 'France' },
    teamLead: true,
    openToWork: false,
    scheduleMeetingCount: 9,
    officeHours: 'https://cal.com/lucas',
    ohStatus: 'OK',
    skills: [{ title: 'Product Strategy' }, { title: 'IPFS' }, { title: 'DevRel' }],
  },
  {
    id: 'nadia-haddad',
    name: 'Nadia Haddad',
    role: 'Investor',
    mainTeam: { name: 'Meridian Ventures', role: 'Partner' },
    teams: [team('Meridian Ventures', 'Partner')],
    location: { city: 'Dubai', country: 'UAE' },
    teamLead: false,
    openToWork: false,
    scheduleMeetingCount: 3,
    officeHours: 'https://cal.com/nadia',
    ohStatus: 'OK',
    skills: [{ title: 'Seed Investing' }, { title: 'Infra' }, { title: 'AI' }],
  },
  {
    id: 'kenji-watanabe',
    name: 'Kenji Watanabe',
    role: 'Research Scientist',
    mainTeam: { name: 'CryptoNet', role: 'Research Scientist' },
    teams: [team('CryptoNet', 'Research Scientist')],
    location: { city: 'Tokyo', country: 'Japan' },
    teamLead: false,
    openToWork: true,
    scheduleMeetingCount: 0,
    officeHours: null,
    ohStatus: null,
    skills: [{ title: 'Zero Knowledge' }, { title: 'Math' }, { title: 'Papers' }],
  },
  {
    id: 'sofia-rossi',
    name: 'Sofia Rossi',
    role: 'Design Lead',
    mainTeam: { name: 'Station', role: 'Design Lead' },
    teams: [team('Station', 'Design Lead')],
    location: { city: 'Milan', country: 'Italy' },
    teamLead: true,
    openToWork: true,
    scheduleMeetingCount: 6,
    officeHours: 'https://cal.com/sofia',
    ohStatus: 'OK',
    skills: [{ title: 'Product Design' }, { title: 'Design Systems' }, { title: 'Prototyping' }],
  },
  {
    id: 'david-chen',
    name: 'David Chen',
    role: 'Smart Contract Engineer',
    mainTeam: { name: 'Spark Protocol', role: 'Smart Contract Engineer' },
    teams: [team('Spark Protocol', 'Smart Contract Engineer')],
    location: { city: 'Singapore', country: 'Singapore' },
    teamLead: false,
    openToWork: false,
    scheduleMeetingCount: 2,
    officeHours: null,
    ohStatus: null,
    skills: [{ title: 'Solidity' }, { title: 'DeFi' }, { title: 'Security' }],
  },
  {
    id: 'olga-petrova',
    name: 'Olga Petrova',
    role: 'Data Scientist',
    mainTeam: { name: 'OSO', role: 'Data Scientist' },
    teams: [team('OSO', 'Data Scientist')],
    location: { city: 'Warsaw', country: 'Poland' },
    teamLead: false,
    openToWork: true,
    scheduleMeetingCount: 5,
    officeHours: 'https://cal.com/olga',
    ohStatus: 'OK',
    skills: [{ title: 'Data Science' }, { title: 'Python' }, { title: 'Impact Metrics' }],
  },
  {
    id: 'marcus-bell',
    name: 'Marcus Bell',
    role: 'Community Lead',
    mainTeam: { name: 'Protocol Labs', role: 'Community Lead' },
    teams: [team('Protocol Labs', 'Community Lead')],
    location: { city: 'Austin', country: 'USA' },
    teamLead: false,
    openToWork: false,
    scheduleMeetingCount: 11,
    officeHours: 'https://cal.com/marcus',
    ohStatus: 'OK',
    skills: [{ title: 'Community' }, { title: 'Events' }, { title: 'Partnerships' }],
  },
  {
    id: 'fatima-zahra',
    name: 'Fatima Zahra',
    role: 'Founder & CTO',
    mainTeam: { name: 'Helia Systems', role: 'Founder & CTO' },
    teams: [team('Helia Systems', 'Founder & CTO')],
    location: { city: 'Casablanca', country: 'Morocco' },
    teamLead: true,
    openToWork: false,
    scheduleMeetingCount: 4,
    officeHours: 'https://cal.com/fatima',
    ohStatus: 'OK',
    skills: [{ title: 'Edge Compute' }, { title: 'Systems' }, { title: 'Leadership' }],
  },
  {
    id: 'james-oneill',
    name: "James O'Neill",
    role: 'Growth Engineer',
    mainTeam: { name: 'Tableland', role: 'Growth Engineer' },
    teams: [team('Tableland', 'Growth Engineer')],
    location: { city: 'Dublin', country: 'Ireland' },
    teamLead: false,
    openToWork: true,
    scheduleMeetingCount: 0,
    officeHours: null,
    ohStatus: null,
    skills: [{ title: 'Growth' }, { title: 'Analytics' }, { title: 'TypeScript' }],
  },
];

export interface FilterGroup {
  title: string;
  options: string[];
}

export const FILTER_GROUPS: FilterGroup[] = [
  { title: 'Skills', options: ['Distributed Systems', 'Cryptography', 'Product Design', 'Fundraising', 'DeFi'] },
  { title: 'Region', options: ['Europe', 'North America', 'Asia', 'Africa', 'Middle East'] },
  { title: 'Role', options: ['Founder', 'Engineer', 'Investor', 'Designer', 'Researcher'] },
];

export const SORT_OPTIONS = [
  { value: 'asc', label: 'A-Z (Ascending)' },
  { value: 'desc', label: 'Z-A (Descending)' },
];
