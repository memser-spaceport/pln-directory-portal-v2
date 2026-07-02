import type { ITeam } from '@/types/teams.types';

// Minimal shape the TeamGridView card actually reads: name, shortDescription,
// logo (left undefined so the card uses its local default-profile fallback),
// and industryTags. Cast to ITeam at the call site.
export type MockTeamCard = Pick<ITeam, 'id' | 'name' | 'shortDescription' | 'industryTags'> & {
  logo?: string;
};

export const MOCK_TEAMS: MockTeamCard[] = [
  {
    id: 'protocol-labs',
    name: 'Protocol Labs',
    shortDescription:
      'Building protocols, tools, and services to radically improve the internet — IPFS, Filecoin, libp2p and more.',
    industryTags: [
      { uid: 't1', title: 'Infrastructure' },
      { uid: 't2', title: 'Web3' },
      { uid: 't3', title: 'Storage' },
    ],
  },
  {
    id: 'filecoin-foundation',
    name: 'Filecoin Foundation',
    shortDescription: 'Facilitating governance of the Filecoin network and funding research into decentralized storage.',
    industryTags: [],
  },
  {
    id: 'libp2p',
    name: 'libp2p',
    shortDescription: 'A modular network stack that lets you build peer-to-peer applications across any transport.',
    industryTags: [
      { uid: 't1', title: 'Infrastructure' },
      { uid: 't4', title: 'Networking' },
    ],
  },
  {
    id: 'ipfs-collective',
    name: 'IPFS Collective',
    shortDescription: 'A content-addressed, peer-to-peer hypermedia protocol making the web faster, safer and more open.',
    industryTags: [
      { uid: 't3', title: 'Storage' },
      { uid: 't5', title: 'Content Addressing' },
    ],
  },
  {
    id: 'drand',
    name: 'drand',
    shortDescription: 'A distributed randomness beacon daemon producing publicly verifiable, unbiased random values.',
    industryTags: [
      { uid: 't6', title: 'Cryptography' },
      { uid: 't1', title: 'Infrastructure' },
    ],
  },
  {
    id: 'fil-builders',
    name: 'FIL Builders',
    shortDescription: 'A community-led group supporting builders shipping on Filecoin and the broader IPFS ecosystem.',
    industryTags: [
      { uid: 't7', title: 'Community' },
      { uid: 't2', title: 'Web3' },
    ],
  },
  {
    id: 'bacalhau',
    name: 'Bacalhau',
    shortDescription: 'Compute-over-data platform that runs jobs where the data already lives to cut egress and latency.',
    industryTags: [
      { uid: 't8', title: 'Compute' },
      { uid: 't3', title: 'Storage' },
    ],
  },
  {
    id: 'lotus',
    name: 'Lotus',
    shortDescription: 'The reference implementation of the Filecoin protocol, written in Go for storage providers.',
    industryTags: [
      { uid: 't1', title: 'Infrastructure' },
      { uid: 't9', title: 'Go' },
    ],
  },
  {
    id: 'web3-storage',
    name: 'web3.storage',
    shortDescription: 'Simple APIs to store and retrieve data on the decentralized web with the durability of Filecoin.',
    industryTags: [
      { uid: 't3', title: 'Storage' },
      { uid: 't10', title: 'Developer Tools' },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    shortDescription: 'A community-run, web3 content delivery network providing fast retrieval for the Filecoin ecosystem.',
    industryTags: [
      { uid: 't4', title: 'Networking' },
      { uid: 't11', title: 'CDN' },
    ],
  },
  {
    id: 'protocol-ai',
    name: 'Protocol AI',
    shortDescription: 'Research lab exploring the intersection of decentralized infrastructure and machine learning workloads.',
    industryTags: [
      { uid: 't12', title: 'AI' },
      { uid: 't8', title: 'Compute' },
    ],
  },
  {
    id: 'spacescope',
    name: 'Spacescope',
    shortDescription: 'Open data and analytics dashboards that bring transparency to the Filecoin storage economy.',
    industryTags: [
      { uid: 't13', title: 'Data & Analytics' },
      { uid: 't2', title: 'Web3' },
    ],
  },
];

/**
 * Filter option lists in the production `BaseFilterItem` shape
 * ({ value, disabled, count? }) so they can feed the real `createFilterGetter`
 * → `GenericCheckboxList` pipeline verbatim.
 */
export type MockFilterItem = { value: string; disabled: boolean; count?: number };

export const MOCK_TAGS: MockFilterItem[] = [
  { value: 'Infrastructure', disabled: false, count: 3 },
  { value: 'Web3', disabled: false, count: 3 },
  { value: 'Storage', disabled: false, count: 4 },
  { value: 'Networking', disabled: false, count: 2 },
  { value: 'Compute', disabled: false, count: 2 },
  { value: 'AI', disabled: false, count: 1 },
  { value: 'Community', disabled: false, count: 1 },
  { value: 'Developer Tools', disabled: false, count: 1 },
  { value: 'Data & Analytics', disabled: false, count: 1 },
  { value: 'CDN', disabled: false, count: 1 },
  { value: 'Go', disabled: false, count: 1 },
];

export const MOCK_MEMBERSHIP_SOURCES: MockFilterItem[] = [
  { value: 'Protocol Labs', disabled: false },
  { value: 'Filecoin Foundation', disabled: false },
  { value: 'IPFS Ecosystem', disabled: false },
];

export const MOCK_FUNDING_STAGES: MockFilterItem[] = [
  { value: 'Pre-Seed', disabled: false },
  { value: 'Seed', disabled: false },
  { value: 'Series A', disabled: false },
  { value: 'Series B', disabled: false },
  { value: 'Growth', disabled: false },
];
