import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

/**
 * For You levers — mocked data only.
 *
 * The three confirmed inputs to For You (see README.md):
 *   1. the teams you are on (+ which one is primary)
 *   2. the teams you follow
 *   3. "Teams to follow" matches whose reason is a focus area of your team
 * Nothing else is modelled, and no UI string names anything else.
 */

export type Variant = 'current' | 'follow' | 'explain' | 'thin-feed';

export const VARIANTS: { id: Variant; label: string }[] = [
  { id: 'current', label: 'Current' },
  { id: 'follow', label: 'Follow' },
  { id: 'explain', label: 'Explain' },
  { id: 'thin-feed', label: 'Thin feed' },
];

/** Under this many stories For You counts as quiet (the thin-feed ask shows). */
export const THIN_FEED_THRESHOLD = 5;

export const VIEWER = {
  uid: 'viewer-1',
  name: 'Alex Rivera',
  /** Lever 1. The primary team is first. */
  teams: [{ uid: 'lattice-compute', name: 'Lattice Compute', primary: true }],
  /** The primary team's focus areas — what lever 3 matches against. */
  teamFocusAreas: ['Storage', 'Infrastructure'],
};

export interface MockTeam {
  uid: string;
  name: string;
  logo: string | null;
  /** The team's focus area — also the reason string Teams to follow returns. */
  focusArea: string;
}

export const TEAMS: Record<string, MockTeam> = {
  'lattice-compute': { uid: 'lattice-compute', name: 'Lattice Compute', logo: '/icons/technology/fvm.svg', focusArea: 'Infrastructure' },
  libp2p: { uid: 'libp2p', name: 'libp2p', logo: '/icons/technology/libp2p.svg', focusArea: 'Networking' },
  drand: { uid: 'drand', name: 'drand', logo: '/icons/technology/drand.svg', focusArea: 'Infrastructure' },
  'ritual-net': { uid: 'ritual-net', name: 'Ritual', logo: '/icons/technology/ipld.svg', focusArea: 'Compute' },
  'exo-labs': { uid: 'exo-labs', name: 'Exo Labs', logo: '/icons/technology/sourcecred.svg', focusArea: 'Edge AI' },
  'filecoin-foundation': {
    uid: 'filecoin-foundation',
    name: 'Filecoin Foundation',
    logo: '/icons/technology/filecoin.svg',
    focusArea: 'Storage',
  },
  'prime-intellect': { uid: 'prime-intellect', name: 'Prime Intellect', logo: null, focusArea: 'AI' },
  'proprio-labs': { uid: 'proprio-labs', name: 'Proprio Labs', logo: null, focusArea: 'Robotics' },
  'helia-labs': { uid: 'helia-labs', name: 'Helia Labs', logo: null, focusArea: 'Networking' },
  'kinetic-foundry': { uid: 'kinetic-foundry', name: 'Kinetic Foundry', logo: null, focusArea: 'Hardware' },
};

/**
 * The feed state the page opens in. "Quiet" is a member who follows one team:
 * For You has 3 stories. "Busy" follows four: 6 stories.
 */
export type FeedSize = 'quiet' | 'busy';

export const INITIAL_FOLLOWS: Record<FeedSize, string[]> = {
  quiet: ['libp2p'],
  busy: ['libp2p', 'drand', 'ritual-net', 'exo-labs'],
};

/**
 * Teams to follow, in the order the backend returns them. `reason` is the
 * string production's `ISuggestedTeam.reason` carries; here it is always a
 * focus area (the shape the brief describes, e.g. "Storage").
 *
 * Filecoin Foundation's reason matches the viewer's team focus, so it is
 * ALREADY in For You through lever 3 — following it changes the why-line,
 * not the story count. That's README question 3.
 */
export const SUGGESTED_TEAM_UIDS: string[] = [
  'prime-intellect',
  'proprio-labs',
  'helia-labs',
  'filecoin-foundation',
  'kinetic-foundry',
  'ritual-net',
  'exo-labs',
];

function story(
  uid: string,
  teamUid: string,
  eventType: TeamNewsEventType,
  hoursAgo: number,
  title: string,
  summary: string,
  sourceDomain: string,
): ITeamNewsItem {
  const team = TEAMS[teamUid];
  const date = new Date(Date.now() - hoursAgo * 3600_000).toISOString();
  return {
    uid,
    teamUid,
    teamName: team.name,
    teamLogoUrl: team.logo,
    eventType,
    eventDate: date,
    title,
    summary,
    sourceUrl: `https://${sourceDomain}`,
    sourceDomain,
    tags: [],
    focusAreas: [team.focusArea],
    subFocusAreas: [],
    createdAt: date,
    discussion: { count: 0, latestTopicUrl: null },
  };
}

/** One story per team this week — enough to make each lever's effect countable. */
export const STORIES: ITeamNewsItem[] = [
  story(
    'n-lattice',
    'lattice-compute',
    'FUNDING',
    20,
    'Lattice Compute raises $4.2M seed extension',
    'The extension funds a second region for verifiable GPU jobs and two hires on the scheduler team.',
    'lattice.dev',
  ),
  story(
    'n-libp2p',
    'libp2p',
    'LAUNCH',
    30,
    'libp2p v0.40 ships a shared peer-routing format',
    'Implementations in Go, Rust and JS can now read each other’s routing tables without a translation layer.',
    'libp2p.io',
  ),
  story(
    'n-filecoin',
    'filecoin-foundation',
    'ANNOUNCEMENT',
    44,
    'Grants round opens for verifiable AI-dataset storage',
    'Up to $50k per team for tooling that proves where a training set came from and that it has not changed.',
    'fil.org',
  ),
  story(
    'n-drand',
    'drand',
    'MILESTONE',
    52,
    'League of Entropy grows to 24 independent operators',
    'Three new operators joined this week, spreading the randomness beacon across five more jurisdictions.',
    'drand.love',
  ),
  story(
    'n-ritual',
    'ritual-net',
    'PARTNERSHIP',
    60,
    'Ritual and Lattice Compute open a shared inference marketplace',
    'A job posted to either network can now be filled by the other, behind one settlement layer.',
    'ritual.net',
  ),
  story(
    'n-exo',
    'exo-labs',
    'LAUNCH',
    70,
    'Exo ships on-device model sharding for consumer hardware',
    'A single large model now runs split across a handful of laptops and phones on the same network.',
    'exolabs.net',
  ),
  story(
    'n-prime',
    'prime-intellect',
    'FUNDING',
    8,
    'Prime Intellect raises $18M to train models across decentralized compute',
    'The round funds a scheduler that splits training runs across volunteer and spot GPU capacity.',
    'techcrunch.com',
  ),
  story(
    'n-proprio',
    'proprio-labs',
    'FUNDING',
    14,
    'Proprio Labs closes $9M seed for open-source robot hands',
    'The design files ship under an open licence; the money goes into a small production run for labs.',
    'proprio.dev',
  ),
  story(
    'n-helia',
    'helia-labs',
    'LAUNCH',
    26,
    'Helia 3.0 brings IPFS to service workers',
    'Web apps can now fetch and verify content-addressed data offline, from inside the browser.',
    'helia.io',
  ),
  story(
    'n-kinetic',
    'kinetic-foundry',
    'MILESTONE',
    36,
    'Kinetic Foundry ships its 1,000th open actuator kit',
    'Most went to university labs; the next batch adds a torque sensor the community asked for.',
    'kineticfoundry.com',
  ),
];

export const STORY_BY_TEAM: Record<string, ITeamNewsItem> = Object.fromEntries(STORIES.map((s) => [s.teamUid, s]));
