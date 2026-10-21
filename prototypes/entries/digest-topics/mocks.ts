import type { TeamNewsEventType } from '@/types/team-news.types';

// The news categories from the Home feed's category row, in its order.
// "Discussions" is left out on purpose: in the digest, forum discussions are
// already the "Forum activity" toggle, so a Discussions chip would duplicate it.
// HIRING exists in TeamNewsEventType but isn't in the feed's row, so it's not here.
export const CATEGORIES: TeamNewsEventType[] = [
  'FUNDING',
  'LAUNCH',
  'PARTNERSHIP',
  'ANNOUNCEMENT',
  'MILESTONE',
  'DEALS',
  'OTHER',
];

// The profile signals For You and the digest suggest news from. Only the ones confirmed
// by the user are named (skills, focus areas). Add more here once confirmed.
export type Persona = 'complete' | 'investor' | 'empty';

export interface FollowedTeam {
  uid: string;
  name: string;
  logo: string;
  focusArea: string;
}

export interface PersonaMock {
  label: string;
  skills: string[];
  follows: FollowedTeam[];
  /** Focus areas and where they come from; null = nothing to read them from. */
  focus: null | { from: 'team'; teamName: string; teamUid: string; areas: string[] } | { from: 'investor'; areas: string[] };
}

export const PERSONAS: Record<Persona, PersonaMock> = {
  complete: {
    label: 'Team member',
    skills: ['Rust', 'Distributed systems', 'Protocol design'],
    follows: [
      { uid: 'libp2p', name: 'libp2p', logo: '/icons/technology/libp2p.svg', focusArea: 'Networking' },
      { uid: 'drand', name: 'drand', logo: '/icons/technology/drand.svg', focusArea: 'Infrastructure' },
      { uid: 'ipfs', name: 'IPFS', logo: '/icons/technology/ipfs.svg', focusArea: 'Storage' },
    ],
    focus: { from: 'team', teamName: 'Protocol Labs', teamUid: 'protocol-labs', areas: ['Infrastructure', 'Networking', 'Storage'] },
  },
  investor: {
    label: 'Investor',
    skills: ['Fundraising', 'Go-to-market'],
    follows: [
      { uid: 'ritual-net', name: 'Ritual', logo: '/icons/technology/ipld.svg', focusArea: 'AI' },
      { uid: 'filecoin', name: 'Filecoin Foundation', logo: '/icons/technology/filecoin.svg', focusArea: 'Storage' },
    ],
    focus: { from: 'investor', areas: ['AI', 'Staking', 'Governance', 'DePIN'] },
  },
  empty: {
    label: 'Empty profile',
    skills: [],
    follows: [],
    focus: null,
  },
};
