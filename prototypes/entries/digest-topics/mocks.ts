// Tags (hashtags) a member can subscribe to: the real list (25), as shipped on
// the news cards. They replace both the Home feed's categories and the team
// focus areas as what shapes For You and the digest.
//
// The GROUPS are invented: a theme split so 25 chips can be scanned by row
// instead of read one by one. Backend question: who owns the grouping?
// Alphabetical inside each group.
export const TAG_GROUPS: { label: string; tags: string[] }[] = [
  {
    label: 'AI & frontier tech',
    tags: ['ai', 'ai-robotics', 'desci', 'frontier-tech', 'neurotech', 'whole-brain-emulation'],
  },
  {
    label: 'Web3 infrastructure',
    tags: [
      'blockchain-protocols',
      'blockchain-security',
      'cryptographic-proofs',
      'decentralized-compute',
      'decentralized-storage',
      'development-infrastructure',
    ],
  },
  {
    label: 'Digital rights',
    tags: ['data-ownership', 'digital-human-rights', 'self-sovereign-identity', 'verifiable-content'],
  },
  {
    label: 'Economies & governance',
    tags: ['capital', 'climate-refi', 'defi', 'degov', 'economies-governance', 'public-goods-funding'],
  },
  {
    label: 'The network',
    tags: ['build-innovation-network', 'network-programs', 'service-providers'],
  },
];

export const TOPICS: string[] = TAG_GROUPS.flatMap((g) => g.tags);

export interface SuggestedTeam {
  uid: string;
  name: string;
  logo: string;
  focusArea: string;
  followers: number;
}

export const SUGGESTED_TEAMS: SuggestedTeam[] = [
  { uid: 'filecoin', name: 'Filecoin Foundation', logo: '/icons/technology/filecoin.svg', focusArea: 'Storage', followers: 412 },
  { uid: 'libp2p', name: 'libp2p', logo: '/icons/technology/libp2p.svg', focusArea: 'Networking', followers: 286 },
  { uid: 'fvm', name: 'FVM', logo: '/icons/technology/fvm.svg', focusArea: 'Infrastructure', followers: 231 },
  { uid: 'ipfs', name: 'IPFS', logo: '/icons/technology/ipfs.svg', focusArea: 'Storage', followers: 198 },
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
    topics: [
      'blockchain-protocols',
      'cryptographic-proofs',
      'decentralized-compute',
      'decentralized-storage',
      'development-infrastructure',
      'network-programs',
    ],
    prefilledFrom: 'your skills and Protocol Labs’ focus areas',
    follows: [
      { uid: 'libp2p', name: 'libp2p', logo: '/icons/technology/libp2p.svg', focusArea: 'Networking' },
      { uid: 'drand', name: 'drand', logo: '/icons/technology/drand.svg', focusArea: 'Infrastructure' },
      { uid: 'ipfs', name: 'IPFS', logo: '/icons/technology/ipfs.svg', focusArea: 'Storage' },
    ],
  },
  investor: {
    label: 'Investor',
    topics: ['ai', 'capital', 'defi', 'economies-governance', 'public-goods-funding'],
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
