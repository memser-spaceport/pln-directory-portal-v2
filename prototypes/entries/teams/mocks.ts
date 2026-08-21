import type { ITeam } from '@/types/teams.types';

// Minimal shape the TeamGridView card actually reads: name, shortDescription,
// logo, and industryTags. Cast to ITeam at the call site.
//
// LOGOS: real assets from `public/`, never invented ones. `icons/technology`
// ships seven square ecosystem marks and the roster below is picked so that all
// seven are on the grid — drand, filecoin, fvm, ipfs, ipld, libp2p and
// sourcecred — which is why FVM, IPLD and SourceCred are in the list at all.
// They're real PL-ecosystem projects, and they're the ones whose marks exist.
//
// The remaining five fall back to a monogram tile (see placeholderLogo.ts).
// That is a hard floor, not a to-do: a prototype may not add files to `public/`,
// and the only other PL asset in the tree is the Demo Day wordmark at 142×24,
// which crops to "toc" in a 72px square. Borrowing the Filecoin mark for every
// Filecoin-adjacent team would be worse than a monogram — four cards that look
// like the same team. A real directory is a mix of logos and initials anyway,
// so the grid shows a mix.
export type MockTeamCard = Pick<ITeam, 'id' | 'name' | 'shortDescription' | 'industryTags'> & {
  logo?: string;
  /**
   * The team has wound down. One flag, because only one of the two states is
   * ever *drawn*: an active team is the default a directory is made of, and
   * marking eleven of twelve cards "Active" would put a green pill on every row
   * that tells the reader nothing they didn't assume. Absence is the state.
   *
   * What sets it is a backend question this prototype deliberately doesn't
   * answer — "wound down for good" and "dormant, nobody has touched it in a
   * year" are different facts and want different words. The UI is the same
   * either way, which is why it's worth building before that's settled. The
   * date it went inactive belongs on the team profile, where there's room for a
   * sentence; a 289px card only has room for the state itself.
   */
  inactive?: boolean;
};

export const MOCK_TEAMS: MockTeamCard[] = [
  {
    id: 'protocol-labs',
    name: 'Protocol Labs',
    // No logo on purpose. The only PL asset in public/ is the Demo Day
    // wordmark, 142×24 — cropped into this card's 72px square slot it renders
    // as "toc", and contained it would be a 12px-tall sliver. A monogram beats
    // a mangled logo.
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
    logo: '/icons/technology/filecoin.svg',
    shortDescription:
      'Facilitating governance of the Filecoin network and funding research into decentralized storage.',
    industryTags: [],
  },
  {
    id: 'libp2p',
    name: 'libp2p',
    logo: '/icons/technology/libp2p.svg',
    shortDescription: 'A modular network stack that lets you build peer-to-peer applications across any transport.',
    industryTags: [
      { uid: 't1', title: 'Infrastructure' },
      { uid: 't4', title: 'Networking' },
    ],
  },
  {
    id: 'ipfs-collective',
    name: 'IPFS Collective',
    logo: '/icons/technology/ipfs.svg',
    shortDescription:
      'A content-addressed, peer-to-peer hypermedia protocol making the web faster, safer and more open.',
    industryTags: [
      { uid: 't3', title: 'Storage' },
      { uid: 't5', title: 'Content Addressing' },
    ],
  },
  {
    id: 'drand',
    name: 'drand',
    logo: '/icons/technology/drand.svg',
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
    id: 'fvm',
    name: 'FVM',
    logo: '/icons/technology/fvm.svg',
    shortDescription:
      'The Filecoin Virtual Machine — user-programmable smart contracts running natively against stored data.',
    industryTags: [
      { uid: 't1', title: 'Infrastructure' },
      { uid: 't8', title: 'Compute' },
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
    shortDescription:
      'Simple APIs to store and retrieve data on the decentralized web with the durability of Filecoin.',
    industryTags: [
      { uid: 't3', title: 'Storage' },
      { uid: 't10', title: 'Developer Tools' },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    shortDescription:
      'A community-run, web3 content delivery network providing fast retrieval for the Filecoin ecosystem.',
    industryTags: [
      { uid: 't4', title: 'Networking' },
      { uid: 't11', title: 'CDN' },
    ],
    inactive: true,
  },
  {
    id: 'ipld',
    name: 'IPLD',
    logo: '/icons/technology/ipld.svg',
    shortDescription:
      'The data model for content-addressed systems — one set of rules for linking data across IPFS and Filecoin.',
    industryTags: [
      { uid: 't5', title: 'Content Addressing' },
      { uid: 't10', title: 'Developer Tools' },
    ],
  },
  {
    // The inactive card that carries a real mark, which is the point of putting
    // it here: greyscale on a monogram is barely a change (the tile is already
    // near-neutral), where the same filter on a real logo is unmistakable. It's
    // also honest casting — SourceCred is a PL-ecosystem project that genuinely
    // wound down, so the state isn't invented for a team still shipping.
    id: 'sourcecred',
    name: 'SourceCred',
    logo: '/icons/technology/sourcecred.svg',
    shortDescription:
      'A tool for open-source communities to measure the contributions their members make, and reward them.',
    industryTags: [
      { uid: 't7', title: 'Community' },
      { uid: 't13', title: 'Data & Analytics' },
    ],
    inactive: true,
  },
];

/**
 * Filter option lists in the production `BaseFilterItem` shape
 * ({ value, disabled, count? }) so they can feed the real `createFilterGetter`
 * → `GenericCheckboxList` pipeline verbatim.
 */
export type MockFilterItem = { value: string; disabled: boolean; count?: number };

/**
 * Counts are the real tallies over MOCK_TEAMS — a filter that promises 3 and
 * returns 2 is the kind of thing a reader notices immediately, and it's the
 * first thing to rot when the roster changes.
 *
 * "Content Addressing" and "Cryptography" are new to this list rather than to
 * the data: IPFS Collective and drand have carried them since the roster was
 * written, but the filter never offered either, so three teams were unreachable
 * through the panel. Adding IPLD made the first gap obvious and a tally script
 * over the roster turned up the second. "AI" came off the same way — Protocol AI
 * was the only team with it, and it left the roster.
 */
export const MOCK_TAGS: MockFilterItem[] = [
  { value: 'Infrastructure', disabled: false, count: 5 },
  { value: 'Storage', disabled: false, count: 3 },
  { value: 'Web3', disabled: false, count: 2 },
  { value: 'Networking', disabled: false, count: 2 },
  { value: 'Content Addressing', disabled: false, count: 2 },
  { value: 'Community', disabled: false, count: 2 },
  { value: 'Developer Tools', disabled: false, count: 2 },
  { value: 'Compute', disabled: false, count: 1 },
  { value: 'Cryptography', disabled: false, count: 1 },
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
