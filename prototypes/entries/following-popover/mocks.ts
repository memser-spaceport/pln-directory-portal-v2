import type { FollowableKind } from '../follow-shared/types';

export interface FollowEntity {
  id: string;
  name: string;
  subtitle: string;
  image?: string | null;
  kind: FollowableKind;
}

// People + teams you follow (the actionable list — it curates your feed).
export const FOLLOWING_PEOPLE: FollowEntity[] = [
  { id: 'maya', name: 'Maya Okonkwo', subtitle: 'Co-founder & CEO · Lattice Compute', kind: 'member', image: 'https://i.pravatar.cc/96?img=47' },
  { id: 'juan', name: 'Juan Benet', subtitle: 'Founder & CEO · Protocol Labs', kind: 'member', image: 'https://i.pravatar.cc/96?img=12' },
  { id: 'molly', name: 'Molly Mackinlay', subtitle: 'Project Lead, IPFS', kind: 'member', image: 'https://i.pravatar.cc/96?img=32' },
  { id: 'david', name: 'David Dias', subtitle: 'Research Engineer · libp2p', kind: 'member', image: 'https://i.pravatar.cc/96?img=15' },
];

export const FOLLOWING_TEAMS: FollowEntity[] = [
  { id: 'protocol-labs', name: 'Protocol Labs', subtitle: 'Infrastructure · Web3', kind: 'team' },
  { id: 'filecoin-foundation', name: 'Filecoin Foundation', subtitle: 'Decentralized storage', kind: 'team' },
  { id: 'libp2p', name: 'libp2p', subtitle: 'Peer-to-peer networking', kind: 'team' },
];

// People who follow you. Some you already follow back, some you don't.
export const FOLLOWERS: FollowEntity[] = [
  { id: 'maya', name: 'Maya Okonkwo', subtitle: 'Co-founder & CEO · Lattice Compute', kind: 'member', image: 'https://i.pravatar.cc/96?img=47' },
  { id: 'steven', name: 'Steven Allen', subtitle: 'Systems Engineer · Protocol Labs', kind: 'member', image: 'https://i.pravatar.cc/96?img=8' },
  { id: 'sarah', name: 'Sarah Kim', subtitle: 'Partner · Acme Capital', kind: 'member', image: 'https://i.pravatar.cc/96?img=44' },
  { id: 'devon', name: 'Devon Park', subtitle: 'Protocol Engineer', kind: 'member', image: 'https://i.pravatar.cc/96?img=53' },
];

// Initially-followed ids — everyone in the following lists.
export const INITIAL_FOLLOWED = [...FOLLOWING_PEOPLE, ...FOLLOWING_TEAMS].map((e) => e.id);

/** Shown on the Followers tab label (you have many more followers than follows). */
export const FOLLOWER_COUNT = 1284;
/** How many of your followers are inside your own teams — network proof. */
export const FOLLOWERS_IN_NETWORK = 36;
