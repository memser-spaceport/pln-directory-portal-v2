// Static mock data for the Advisors MVP prototype
// All data is self-contained — no API calls needed

export interface ProtoAdvisor {
  id: string;
  name: string;
  company: string;
  role: string;
  location: string;
  bio: string;
  expertise: string[];
  avatar: string;
  calendarProvider: 'calcom' | 'calendly' | null;
  calendarConnected: boolean;
  availState: 'available' | 'request' | 'none' | 'invite';
  nextAvailable: string | null;
}

export interface ProtoSlot {
  date: string;
  dateLabel: string;
  time: string;
  endTime: string;
  available: boolean;
}

export interface ProtoMember {
  id: string;
  name: string;
  company: string;
  role: string;
  location: string;
  avatar: string;
  isAdvisor: boolean;
}

// ── Primary advisor (Aisha Mensah) ────────────────────────────────────────────

export const PROTO_ADVISOR: ProtoAdvisor = {
  id: 'advisor-001',
  name: 'Aisha Mensah',
  company: 'Uniswap Labs',
  role: 'Head of Research',
  location: 'San Francisco, US',
  bio: `Protocol researcher and DeFi architect with 8+ years in decentralised systems. Previously led research at a top L1 foundation.\n\nI help early-stage Web3 teams design sustainable token economies and protocol mechanics. Office hours focus on DeFi primitives, mechanism design, and go-to-market strategy for protocol launches.`,
  expertise: ['DeFi', 'Protocol Design', 'Tokenomics'],
  avatar: 'https://i.pravatar.cc/150?img=10',
  calendarProvider: 'calcom',
  calendarConnected: true,
  availState: 'available',
  nextAvailable: 'Mon, Apr 14',
};

// Request-only advisor (no calendar connected)
export const PROTO_ADVISOR_REQUEST: ProtoAdvisor = {
  id: 'advisor-003',
  name: 'Priya Nair',
  company: 'OpenZeppelin',
  role: 'Lead Auditor',
  location: 'Bangalore, India',
  bio: `Smart contract security researcher. Audited 60+ protocols and found critical bugs in top-10 DeFi projects.\n\nI review smart contract architectures, help teams prepare for audits, and advise on secure upgrade patterns. Calendar not yet connected — reach out directly to request a session.`,
  expertise: ['Smart Contracts', 'Security Audits', 'Solidity'],
  avatar: 'https://i.pravatar.cc/150?img=20',
  calendarProvider: null,
  calendarConnected: false,
  availState: 'request',
  nextAvailable: null,
};

// ── Directory advisors (6 cards, mixed states) ────────────────────────────────

export const PROTO_DIRECTORY_ADVISORS: ProtoAdvisor[] = [
  PROTO_ADVISOR,
  {
    id: 'advisor-002',
    name: 'Carlos Reyes',
    company: 'Anthropic',
    role: 'Growth Lead',
    location: 'Mexico City, MX',
    bio: 'Growth hacker and GTM strategist. Built and scaled user acquisition for three crypto unicorns.',
    expertise: ['Growth Strategy', 'Marketing', 'Community Building'],
    avatar: 'https://i.pravatar.cc/150?img=11',
    calendarProvider: 'calendly',
    calendarConnected: true,
    availState: 'available',
    nextAvailable: 'Tue, Apr 15',
  },
  PROTO_ADVISOR_REQUEST,
  {
    id: 'advisor-004',
    name: 'Marcus Webb',
    company: 'a16z crypto',
    role: 'Former Partner',
    location: 'London, UK',
    bio: 'Former VC partner turned founder. Closed $120M+ in funding rounds across seed to Series B.',
    expertise: ['Fundraising', 'VC Relations', 'Pitch Deck'],
    avatar: 'https://i.pravatar.cc/150?img=13',
    calendarProvider: 'calcom',
    calendarConnected: true,
    availState: 'available',
    nextAvailable: 'Wed, Apr 16',
  },
  {
    id: 'advisor-007',
    name: 'Lena Hoffmann',
    company: 'MetaMask',
    role: 'Head of Design',
    location: 'Berlin, DE',
    bio: 'Product designer and UX researcher who has shipped wallets, DEXs, and NFT platforms used by millions.',
    expertise: ['Product Design', 'UX Research', 'Web3 UX'],
    avatar: 'https://i.pravatar.cc/150?img=16',
    calendarProvider: 'calcom',
    calendarConnected: true,
    availState: 'available',
    nextAvailable: 'Mon, Apr 14',
  },
  {
    id: 'advisor-010',
    name: 'David Kim',
    company: 'OpenAI',
    role: 'Research Scientist',
    location: 'Seoul, KR',
    bio: 'ML researcher exploring the intersection of AI agents, on-chain data, and decentralised compute.',
    expertise: ['AI / ML', 'Decentralised Compute', 'Agent Networks'],
    avatar: 'https://i.pravatar.cc/150?img=18',
    calendarProvider: 'calendly',
    calendarConnected: true,
    availState: 'available',
    nextAvailable: 'Thu, Apr 17',
  },
];

// ── Available slots (for Aisha Mensah) ───────────────────────────────────────

export const PROTO_SLOTS: ProtoSlot[] = [
  { date: '2026-04-14', dateLabel: 'Mon, Apr 14', time: '9:00 am', endTime: '9:30 am', available: true },
  { date: '2026-04-14', dateLabel: 'Mon, Apr 14', time: '9:30 am', endTime: '10:00 am', available: true },
  { date: '2026-04-14', dateLabel: 'Mon, Apr 14', time: '10:00 am', endTime: '10:30 am', available: false },
  { date: '2026-04-14', dateLabel: 'Mon, Apr 14', time: '10:30 am', endTime: '11:00 am', available: true },
  { date: '2026-04-16', dateLabel: 'Wed, Apr 16', time: '2:00 pm', endTime: '2:30 pm', available: true },
  { date: '2026-04-16', dateLabel: 'Wed, Apr 16', time: '2:30 pm', endTime: '3:00 pm', available: true },
  { date: '2026-04-16', dateLabel: 'Wed, Apr 16', time: '3:00 pm', endTime: '3:30 pm', available: true },
  { date: '2026-04-16', dateLabel: 'Wed, Apr 16', time: '3:30 pm', endTime: '4:00 pm', available: true },
  { date: '2026-04-21', dateLabel: 'Mon, Apr 21', time: '9:00 am', endTime: '9:30 am', available: true },
  { date: '2026-04-21', dateLabel: 'Mon, Apr 21', time: '9:30 am', endTime: '10:00 am', available: true },
];

// ── Availability calendar events (for edit availability screen) ───────────────

export const PROTO_CAL_EVENTS = [
  { dayIdx: 1, startH: 9, endH: 9.5, title: 'Standup' },
  { dayIdx: 1, startH: 14, endH: 15, title: 'Product Review' },
  { dayIdx: 2, startH: 10, endH: 10.5, title: '1:1 with CEO' },
  { dayIdx: 3, startH: 12, endH: 13, title: 'Lunch' },
  { dayIdx: 3, startH: 15, endH: 17, title: 'Board Prep' },
  { dayIdx: 4, startH: 11, endH: 12, title: 'All Hands' },
];

// Pre-selected availability windows for the advisor
export const PROTO_AVAIL_WINDOWS = [
  { dayIdx: 1, startH: 9, endH: 11 },   // Monday 9–11am
  { dayIdx: 3, startH: 14, endH: 16 },  // Wednesday 2–4pm
];

// ── Members list (mix of advisors + regular members) ─────────────────────────

export const PROTO_MEMBERS: ProtoMember[] = [
  { id: 'm-001', name: 'Aisha Mensah', company: 'Uniswap Labs', role: 'Head of Research', location: 'San Francisco, US', avatar: 'https://i.pravatar.cc/150?img=10', isAdvisor: true },
  { id: 'm-002', name: 'Carlos Reyes', company: 'Anthropic', role: 'Growth Lead', location: 'Mexico City, MX', avatar: 'https://i.pravatar.cc/150?img=11', isAdvisor: true },
  { id: 'm-003', name: 'Priya Nair', company: 'OpenZeppelin', role: 'Lead Auditor', location: 'Bangalore, IN', avatar: 'https://i.pravatar.cc/150?img=20', isAdvisor: true },
  { id: 'm-004', name: 'Marcus Webb', company: 'a16z crypto', role: 'Former Partner', location: 'London, UK', avatar: 'https://i.pravatar.cc/150?img=13', isAdvisor: false },
  { id: 'm-005', name: 'Yuki Tanaka', company: 'Protocol Labs', role: 'Senior Engineer', location: 'Tokyo, JP', avatar: 'https://i.pravatar.cc/150?img=14', isAdvisor: false },
  { id: 'm-006', name: 'Fatima Al-Hassan', company: 'Coinbase', role: 'Legal Counsel', location: 'Dubai, UAE', avatar: 'https://i.pravatar.cc/150?img=15', isAdvisor: false },
  { id: 'm-007', name: 'Lena Hoffmann', company: 'MetaMask', role: 'Head of Design', location: 'Berlin, DE', avatar: 'https://i.pravatar.cc/150?img=16', isAdvisor: true },
  { id: 'm-008', name: 'Kwame Asante', company: 'Polygon', role: 'DevRel Lead', location: 'Accra, GH', avatar: 'https://i.pravatar.cc/150?img=17', isAdvisor: false },
  { id: 'm-009', name: 'Sofia Pereira', company: 'Chainlink Labs', role: 'Staff Engineer', location: 'São Paulo, BR', avatar: 'https://i.pravatar.cc/150?img=21', isAdvisor: false },
  { id: 'm-010', name: 'David Kim', company: 'OpenAI', role: 'Research Scientist', location: 'Seoul, KR', avatar: 'https://i.pravatar.cc/150?img=18', isAdvisor: false },
  { id: 'm-011', name: 'Rachel Torres', company: 'Consensys', role: 'Product Manager', location: 'New York, US', avatar: 'https://i.pravatar.cc/150?img=22', isAdvisor: false },
  { id: 'm-012', name: 'Brendan Walsh', company: 'Optimism', role: 'Protocol Engineer', location: 'Dublin, IE', avatar: 'https://i.pravatar.cc/150?img=25', isAdvisor: false },
];
