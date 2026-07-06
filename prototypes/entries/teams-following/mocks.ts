// Mocked data for the "Following — manage list" page: the teams (and people)
// the viewer follows, LinkedIn-style. No API — follow state is local only.

export type FollowedKind = 'team' | 'member';

export interface FollowedEntity {
  id: string;
  kind: FollowedKind;
  name: string;
  /** One-line context under the name: team tagline / member role. */
  subtitle: string;
  /** Team logo or member avatar; absent → initials fallback. */
  image?: string | null;
  followers: number;
  /** Recency of the viewer's follow, e.g. "3 weeks ago". */
  followedAgo: string;
}

// Teams you follow — real technology logos where we have them, one logo-less
// team so the initials fallback state is visible.
export const FOLLOWED_TEAMS: FollowedEntity[] = [
  {
    id: 'protocol-labs',
    kind: 'team',
    name: 'Protocol Labs',
    subtitle: 'Web3 R&D — breakthrough computing technologies',
    image: '/icons/demoday/landing/logos/Protocol%20Labs.svg',
    followers: 4820,
    followedAgo: '2 years ago',
  },
  {
    id: 'filecoin-foundation',
    kind: 'team',
    name: 'Filecoin Foundation',
    subtitle: 'Decentralized storage for humanity’s most important information',
    image: '/icons/technology/filecoin.svg',
    followers: 2930,
    followedAgo: '1 year ago',
  },
  {
    id: 'ipfs',
    kind: 'team',
    name: 'IPFS',
    subtitle: 'Peer-to-peer hypermedia protocol',
    image: '/icons/technology/ipfs.svg',
    followers: 3150,
    followedAgo: '8 months ago',
  },
  {
    id: 'libp2p',
    kind: 'team',
    name: 'libp2p',
    subtitle: 'Modular peer-to-peer networking stack',
    image: '/icons/technology/libp2p.svg',
    followers: 1480,
    followedAgo: '8 months ago',
  },
  {
    id: 'fvm',
    kind: 'team',
    name: 'FVM',
    subtitle: 'The Filecoin Virtual Machine',
    image: '/icons/technology/fvm.svg',
    followers: 720,
    followedAgo: '5 months ago',
  },
  {
    id: 'drand',
    kind: 'team',
    name: 'drand',
    subtitle: 'Distributed randomness beacon',
    image: '/icons/technology/drand.svg',
    followers: 640,
    followedAgo: '3 months ago',
  },
  {
    id: 'ipld',
    kind: 'team',
    name: 'IPLD',
    subtitle: 'Data model for content-addressed systems',
    image: '/icons/technology/ipld.svg',
    followers: 510,
    followedAgo: '6 weeks ago',
  },
  {
    id: 'modular-globe',
    kind: 'team',
    name: 'Modular Globe',
    subtitle: 'Neuro data pipelines · PL portfolio',
    image: null,
    followers: 210,
    followedAgo: '2 weeks ago',
  },
];

// People you follow — same roster as the sibling follow prototypes so the
// story stays consistent across entries.
export const FOLLOWED_PEOPLE: FollowedEntity[] = [
  {
    id: 'maya',
    kind: 'member',
    name: 'Maya Okonkwo',
    subtitle: 'Co-founder & CEO · Lattice Compute',
    image: 'https://i.pravatar.cc/96?img=47',
    followers: 342,
    followedAgo: '1 year ago',
  },
  {
    id: 'juan',
    kind: 'member',
    name: 'Juan Benet',
    subtitle: 'Founder & CEO · Protocol Labs',
    image: 'https://i.pravatar.cc/96?img=12',
    followers: 2810,
    followedAgo: '2 years ago',
  },
  {
    id: 'molly',
    kind: 'member',
    name: 'Molly Mackinlay',
    subtitle: 'Project Lead, IPFS',
    image: 'https://i.pravatar.cc/96?img=32',
    followers: 960,
    followedAgo: '6 months ago',
  },
  {
    id: 'david',
    kind: 'member',
    name: 'David Dias',
    subtitle: 'Research Engineer · libp2p',
    image: 'https://i.pravatar.cc/96?img=15',
    followers: 415,
    followedAgo: '3 weeks ago',
  },
];

/** Everything starts followed — this page manages an existing list. */
export const INITIAL_FOLLOWED_IDS = [...FOLLOWED_TEAMS, ...FOLLOWED_PEOPLE].map((e) => e.id);
