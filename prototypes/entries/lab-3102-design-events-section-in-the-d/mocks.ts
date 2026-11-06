/**
 * Mock data for the digest events section (LAB-3102). No API call: every value
 * here is made up. Dates are offsets from today, so the section always shows
 * upcoming events, whenever the prototype is opened.
 */

export interface DigestEvent {
  slug: string;
  name: string;
  /** ISO date-time, like production's IRL event `startDate`. */
  startDate: string;
  endDate: string;
  /** "City, Country", like production's `location` string. */
  location: string;
}

export interface DigestStory {
  uid: string;
  label: string;
  title: string;
  team: string;
}

export interface DigestLine {
  uid: string;
  title: string;
  meta: string;
}

/** An ISO date `days` from today at `hour`:00 UTC. */
function daysFromNow(days: number, hour: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

function event(slug: string, name: string, inDays: number, lastsDays: number, location: string): DigestEvent {
  return {
    slug,
    name,
    location,
    startDate: daysFromNow(inDays, 9),
    endDate: daysFromNow(inDays + lastsDays - 1, 18),
  };
}

/** The matched events, soonest first. The backend (LAB-3103) chooses them; the email shows at most 3. */
export const MATCHED_EVENTS: DigestEvent[] = [
  event('desci-summit', 'DeSci Summit', 6, 2, 'Berlin, Germany'),
  event('builders-night-lisbon', 'Builders Night: Decentralized Storage', 13, 1, 'Lisbon, Portugal'),
  event('funding-the-commons', 'Funding the Commons', 24, 3, 'Singapore, Singapore'),
  event('ipfs-camp', 'IPFS Camp', 29, 2, 'Tokyo, Japan'),
];

export const MAX_EVENTS = 3;

export const DIGEST = {
  subject: 'This week in the network: a $12M seed round and 3 events for you',
  preview: 'Northwind Labs closed a seed round to scale verifiable compute.',
  weekOf: daysFromNow(0, 9),
  topStory: {
    title: 'Northwind Labs raises $12M to scale verifiable compute',
    summary:
      'The round funds a public testnet in Q1 and three new engineering hires. The team builds on IPFS and Filecoin.',
    team: 'Northwind Labs',
    source: 'northwind.example',
  },
  stories: [
    { uid: 's1', label: 'Launch', title: 'Harbor ships a mobile wallet for storage deals', team: 'Harbor' },
    { uid: 's2', label: 'Partnership', title: 'Meridian and Tessel join on a shared data index', team: 'Meridian' },
    { uid: 's3', label: 'Milestone', title: 'Quill passes 1M stored datasets', team: 'Quill' },
  ] as DigestStory[],
  hiring: [
    { uid: 'h1', title: 'Harbor: 4 open roles', meta: '+3 since last week' },
    { uid: 'h2', title: 'Tessel: 2 open roles', meta: 'First roles this year' },
  ] as DigestLine[],
  forum: [
    { uid: 'f1', title: 'How do you price retrieval for small teams?', meta: 'Sam R. · 214 views' },
    { uid: 'f2', title: 'Notes from the zk working group, week 44', meta: 'Ada K. · 132 views' },
  ] as DigestLine[],
};
