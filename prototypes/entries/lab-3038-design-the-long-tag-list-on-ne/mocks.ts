// LAB-3038 mock data. The themes copy production's NEWS_TAG_THEMES
// (components/page/news-preferences/newsTagThemes.ts) and add invented slugs,
// so the list has 44 tags: the size the list grows to as news coverage grows.
// Three themes are longer than the per-theme limit; three are not.

export interface TagTheme {
  title: string;
  slugs: string[];
}

export const TAG_THEMES: TagTheme[] = [
  {
    title: 'AI & frontier tech',
    slugs: [
      'ai',
      'ai-agents',
      'ai-robotics',
      'ai-safety',
      'biotech',
      'brain-computer-interfaces',
      'desci',
      'frontier-tech',
      'longevity',
      'neurotech',
      'quantum-computing',
      'whole-brain-emulation',
    ],
  },
  {
    title: 'Web3 infrastructure',
    slugs: [
      'blockchain-protocols',
      'blockchain-security',
      'cryptographic-proofs',
      'data-availability',
      'decentralized-compute',
      'decentralized-storage',
      'development-infrastructure',
      'interoperability',
      'layer-2',
      'wallets',
      'zero-knowledge',
    ],
  },
  {
    title: 'Digital rights',
    slugs: [
      'data-ownership',
      'digital-human-rights',
      'open-source',
      'privacy',
      'self-sovereign-identity',
      'verifiable-content',
    ],
  },
  {
    title: 'Economies & governance',
    slugs: [
      'capital',
      'climate-refi',
      'dao-tooling',
      'defi',
      'degov',
      'economies-governance',
      'impact-certificates',
      'public-goods-funding',
      'stablecoins',
    ],
  },
  {
    title: 'The network',
    slugs: ['build-innovation-network', 'network-programs', 'service-providers'],
  },
  {
    title: 'Other',
    slugs: ['events', 'hiring', 'research-grants'],
  },
];

/** Option A: the first tags of each theme. */
export const PER_THEME_LIMIT = 8;
/** Option B: the first tags of the whole list, in theme order. */
export const WHOLE_LIST_LIMIT = 20;

export type Persona = 'picks' | 'seeded' | 'empty';

export const PERSONAS: Record<Persona, { label: string; tags: string[]; seeded: boolean; followsTeams: boolean }> = {
  // Two picks sit after the limit of their theme (quantum-computing, zero-knowledge).
  picks: {
    label: 'Has picks',
    tags: ['ai', 'decentralized-storage', 'public-goods-funding', 'quantum-computing', 'zero-knowledge'],
    seeded: false,
    followsTeams: true,
  },
  // A new member follows no teams yet: the Teams card shows "Teams to follow" (version 2).
  seeded: {
    label: 'New member',
    tags: ['cryptographic-proofs', 'decentralized-storage'],
    seeded: true,
    followsTeams: false,
  },
  empty: {
    label: 'No picks',
    tags: [],
    seeded: false,
    followsTeams: true,
  },
};

export interface MockTeam {
  uid: string;
  name: string;
  focusAreas: string[];
}

export const FOLLOWED_TEAMS: MockTeam[] = [
  { uid: 't1', name: 'Northwind Labs', focusAreas: ['Decentralized storage', 'Data availability'] },
  { uid: 't2', name: 'Bluefin Research', focusAreas: ['AI agents', 'AI safety'] },
  { uid: 't3', name: 'Commons Fund', focusAreas: ['Public goods funding'] },
];

// Version 2: teams to follow for a new member. They share the focus areas of the
// member's own team, the same source as the seeded tags (cryptographic-proofs,
// decentralized-storage). Invented names.
export const SUGGESTED_TEAMS: MockTeam[] = [
  { uid: 's1', name: 'Northwind Labs', focusAreas: ['Decentralized storage', 'Data availability'] },
  { uid: 's2', name: 'Prism Proofs', focusAreas: ['Cryptographic proofs'] },
  { uid: 's3', name: 'Harbor Data', focusAreas: ['Decentralized storage'] },
  { uid: 's4', name: 'Lattice Works', focusAreas: ['Cryptographic proofs', 'Zero knowledge'] },
];
