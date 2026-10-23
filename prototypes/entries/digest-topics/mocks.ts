// Topic hashtags a member can subscribe to. Invented placeholders: the real list
// comes from backend. They replace both the Home feed's categories and the team
// focus areas as what shapes For You and the digest.
export const TOPICS: string[] = [
  'ai',
  'depin',
  'storage',
  'networking',
  'infrastructure',
  'zk',
  'p2p',
  'rust',
  'staking',
  'governance',
  'defi',
  'desci',
  'fundraising',
  'open-source',
  'research',
  'privacy',
  'robotics',
  'neurotech',
];

export type Persona = 'complete' | 'investor' | 'empty';

export interface FollowedTeam {
  uid: string;
  name: string;
  logo: string;
  focusArea: string;
}

export interface PersonaMock {
  label: string;
  /** Topics subscribed to on arrival (backend would prefill these). */
  topics: string[];
  /** What the prefilled topics were picked from, for the card's description. */
  prefilledFrom: string | null;
  follows: FollowedTeam[];
}

export const PERSONAS: Record<Persona, PersonaMock> = {
  complete: {
    label: 'Team member',
    topics: ['networking', 'storage', 'infrastructure', 'p2p', 'rust', 'zk'],
    prefilledFrom: 'your skills and Protocol Labs’ focus areas',
    follows: [
      { uid: 'libp2p', name: 'libp2p', logo: '/icons/technology/libp2p.svg', focusArea: 'Networking' },
      { uid: 'drand', name: 'drand', logo: '/icons/technology/drand.svg', focusArea: 'Infrastructure' },
      { uid: 'ipfs', name: 'IPFS', logo: '/icons/technology/ipfs.svg', focusArea: 'Storage' },
    ],
  },
  investor: {
    label: 'Investor',
    topics: ['ai', 'depin', 'staking', 'governance', 'fundraising'],
    prefilledFrom: 'your skills and investment focus',
    follows: [
      { uid: 'ritual-net', name: 'Ritual', logo: '/icons/technology/ipld.svg', focusArea: 'AI' },
      { uid: 'filecoin', name: 'Filecoin Foundation', logo: '/icons/technology/filecoin.svg', focusArea: 'Storage' },
    ],
  },
  empty: {
    label: 'Empty profile',
    topics: [],
    prefilledFrom: null,
    follows: [],
  },
};
