/**
 * Mocked directory members for the Refer modal's people picker.
 * Prototype-only — production would read this from `useAllMembers()`.
 *
 * `signal` is the one-line "why they're a fit" the referral template seeds itself
 * with, so the drafted message never starts from a blank line.
 */
export interface MockMember {
  uid: string;
  name: string;
  title: string;
  team: string;
  /** Seeds the referral template's "why them" sentence. */
  signal: string;
}

export const MOCK_MEMBERS: MockMember[] = [
  {
    uid: 'm-1',
    name: 'Ana Ruiz',
    title: 'Staff Engineer',
    team: 'Filecoin Foundation',
    signal: 'She spent the last three years on libp2p transports and has shipped two production DHT rewrites.',
  },
  {
    uid: 'm-2',
    name: 'Marcus Bell',
    title: 'Product Lead',
    team: 'Textile',
    signal: 'He took Textile’s developer tooling from an internal script to a public SDK with real adoption.',
  },
  {
    uid: 'm-3',
    name: 'Priya Nandakumar',
    title: 'Protocol Researcher',
    team: 'Protocol Labs',
    signal: 'Their consensus work is already cited across the retrieval market specs.',
  },
  {
    uid: 'm-4',
    name: 'Tomás Oliveira',
    title: 'Senior Backend Engineer',
    team: 'Fleek',
    signal: 'He has been running large storage deals at scale and is openly looking for something more protocol-side.',
  },
  {
    uid: 'm-5',
    name: 'Nadia Kovalenko',
    title: 'Design Systems Lead',
    team: 'Lighthouse',
    signal: 'She rebuilt Lighthouse’s component library and mentors two other design teams in the network.',
  },
  {
    uid: 'm-6',
    name: 'Samuel Adeyemi',
    title: 'Developer Advocate',
    team: 'Web3.Storage',
    signal: 'He runs the onboarding workshops that most new storage integrators come through.',
  },
  {
    uid: 'm-7',
    name: 'Wei Chen',
    title: 'Engineering Manager',
    team: 'Protocol Labs',
    signal: 'He has grown a distributed systems team from three to eleven without losing shipping cadence.',
  },
  {
    uid: 'm-8',
    name: 'Isabelle Moreau',
    title: 'Growth Marketer',
    team: 'Ceramic',
    signal: 'She owned the developer funnel that doubled Ceramic’s active integrations last year.',
  },
  {
    uid: 'm-9',
    name: 'Dmitri Volkov',
    title: 'Security Engineer',
    team: 'Nucleus',
    signal: 'He has audited three of the network’s most-used contracts and writes up every finding publicly.',
  },
  {
    uid: 'm-10',
    name: 'Grace Okonkwo',
    title: 'Data Scientist',
    team: 'Starling Lab',
    signal: 'Her provenance analysis tooling is used by two teams outside Starling already.',
  },
];
