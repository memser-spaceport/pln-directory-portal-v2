// mockups/member-directory/mock-data.ts
// 12 members across two pages (PAGE_SIZE = 6).
// Mix of available / booked / no-availability states.

import type { AvailabilityStatus } from '@components/MemberCard';

export const TEAMS = [
  'Protocol Labs',
  'Filecoin Foundation',
  'Ethereum Foundation',
  'IPFS',
  'libp2p',
] as const;

export type Team = (typeof TEAMS)[number];

export interface MockMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  company: Team;
  location: string;
  availability?: AvailabilityStatus;
  tags: string[];
}

const av = (n: number) => `https://i.pravatar.cc/300?img=${n}`;

export const mockMembers: MockMember[] = [
  // ── Page 1 ────────────────────────────────────────────────────────────────
  {
    id: 'm-01',
    name: 'Alex Chen',
    avatar: av(11),
    role: 'Protocol Engineer',
    company: 'Protocol Labs',
    location: 'San Francisco, CA',
    availability: 'available',
    tags: ['Rust', 'IPFS', 'Distributed Systems'],
  },
  {
    id: 'm-02',
    name: 'Sam Rivera',
    avatar: av(32),
    role: 'Research Scientist',
    company: 'Filecoin Foundation',
    location: 'New York, NY',
    availability: 'booked',
    tags: ['Cryptography', 'ZK Proofs', 'Rust'],
  },
  {
    id: 'm-03',
    name: 'Jordan Kim',
    avatar: av(47),
    role: 'Developer Advocate',
    company: 'IPFS',
    location: 'London, UK',
    availability: 'available',
    tags: ['Go', 'TypeScript', 'Developer Experience'],
  },
  {
    id: 'm-04',
    name: 'Riley Park',
    role: 'Cryptographer',
    company: 'Ethereum Foundation',
    location: 'Berlin, DE',
    availability: 'booked',
    tags: ['Cryptography', 'Zero Knowledge', 'Haskell'],
  },
  {
    id: 'm-05',
    name: 'Casey Morgan',
    avatar: av(28),
    role: 'Systems Engineer',
    company: 'Protocol Labs',
    location: 'Austin, TX',
    availability: 'available',
    tags: ['Rust', 'Networking', 'Storage'],
  },
  {
    id: 'm-06',
    name: 'Taylor Blake',
    avatar: av(19),
    role: 'Product Designer',
    company: 'libp2p',
    location: 'Singapore',
    tags: ['Design Systems', 'Figma', 'UX Research'],
  },

  // ── Page 2 ────────────────────────────────────────────────────────────────
  {
    id: 'm-07',
    name: 'Morgan Zhang',
    avatar: av(60),
    role: 'Network Engineer',
    company: 'Filecoin Foundation',
    location: 'Taipei, TW',
    availability: 'available',
    tags: ['Go', 'P2P Networking', 'Protocol Design'],
  },
  {
    id: 'm-08',
    name: 'Avery Santos',
    role: 'Protocol Researcher',
    company: 'Ethereum Foundation',
    location: 'Paris, FR',
    availability: 'booked',
    tags: ['Research', 'Formal Verification', 'Coq'],
  },
  {
    id: 'm-09',
    name: 'Quinn Patel',
    avatar: av(51),
    role: 'Developer Relations',
    company: 'Protocol Labs',
    location: 'Bangalore, IN',
    availability: 'available',
    tags: ['TypeScript', 'Developer Education', 'Web3'],
  },
  {
    id: 'm-10',
    name: 'Skylar Osei',
    avatar: av(37),
    role: 'Distributed Systems Engineer',
    company: 'IPFS',
    location: 'Lagos, NG',
    availability: 'booked',
    tags: ['Go', 'Distributed Systems', 'IPFS'],
  },
  {
    id: 'm-11',
    name: 'Blake Nakamura',
    avatar: av(8),
    role: 'Infrastructure Engineer',
    company: 'libp2p',
    location: 'Tokyo, JP',
    availability: 'available',
    tags: ['Rust', 'Infrastructure', 'WebRTC'],
  },
  {
    id: 'm-12',
    name: 'River Kozlov',
    avatar: av(44),
    role: 'Business Development',
    company: 'Filecoin Foundation',
    location: 'Amsterdam, NL',
    tags: ['Partnerships', 'DeFi', 'Web3'],
  },
];
