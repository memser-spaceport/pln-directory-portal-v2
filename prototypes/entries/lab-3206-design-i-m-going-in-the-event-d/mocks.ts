/**
 * Mock data for LAB-3206. Plain sample names, no real Directory people.
 * Dates are ISO (yyyy-mm-dd) so the date tile can read them.
 */

export type EventRole = 'Host' | 'Speaker' | 'Sponsor';

export interface Attendee {
  uid: string;
  name: string;
  team: string;
}

export interface UpcomingEvent {
  uid: string;
  name: string;
  startDate: string;
  range: string;
  city: string;
  about: string;
  /** Other members who said they are going (the profile owner is not in this list). */
  attendees: Attendee[];
}

export interface PastEvent {
  uid: string;
  name: string;
  date: string;
  roles: EventRole[];
}

export interface DemoDay {
  title: string;
  date: string;
  slug: string;
}

const FIRST = ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Taylor', 'Morgan', 'Jamie', 'Avery', 'Quinn', 'Drew', 'Parker'];
const LAST = ['Rivera', 'Chen', 'Novak', 'Haddad', 'Larsen', 'Moreau', 'Silva', 'Kim', 'Okafor', 'Berg', 'Duarte', 'Ito'];
const TEAMS = ['Lattice Compute', 'Orbit Storage', 'Fernwood Labs', 'Quanta Mesh', 'Harbor Data', 'Northlight'];

function people(count: number, offset: number): Attendee[] {
  return Array.from({ length: count }, (_, i) => {
    const k = (i + offset) % FIRST.length;
    return {
      uid: `p-${offset}-${i}`,
      name: `${FIRST[k]} ${LAST[(k + offset) % LAST.length]}`,
      team: TEAMS[(i + offset) % TEAMS.length],
    };
  });
}

export const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    uid: 'labweek-lisbon',
    name: 'LabWeek Lisbon',
    startDate: '2026-11-18',
    range: 'Nov 18 – 22',
    city: 'Lisbon',
    about: 'Five days of talks, workshops and side events for teams across the network.',
    attendees: people(14, 0),
  },
  {
    uid: 'decentralized-ai-dinner',
    name: 'Decentralized AI founders dinner',
    startDate: '2026-11-20',
    range: 'Nov 20',
    city: 'Lisbon',
    about: 'A small dinner for founders who build AI on open networks. Seats are limited.',
    attendees: people(5, 3),
  },
  {
    uid: 'storage-summit',
    name: 'Open Storage Summit',
    startDate: '2026-12-03',
    range: 'Dec 3 – 4',
    city: 'Berlin',
    about: 'Two days on storage protocols, retrieval markets and data onboarding.',
    attendees: people(9, 5),
  },
  {
    uid: 'founders-retreat',
    name: 'Founders Retreat Winter',
    startDate: '2026-12-10',
    range: 'Dec 10 – 12',
    city: 'Denver',
    about: 'A retreat for portfolio founders: peer groups, office hours and planning for next year.',
    attendees: people(11, 7),
  },
  {
    uid: 'zk-day',
    name: 'ZK Research Day',
    startDate: '2027-01-14',
    range: 'Jan 14',
    city: 'Paris',
    about: 'Research talks on zero-knowledge proofs and their use in production systems.',
    attendees: people(7, 2),
  },
  {
    uid: 'funding-the-commons',
    name: 'Funding the Commons',
    startDate: '2027-02-06',
    range: 'Feb 6 – 7',
    city: 'Bangkok',
    about: 'Talks and sessions on public goods funding and open source sustainability.',
    attendees: people(12, 9),
  },
  {
    uid: 'devconnect-side',
    name: 'Network Builders Breakfast',
    startDate: '2027-03-02',
    range: 'Mar 2',
    city: 'Buenos Aires',
    about: 'A breakfast for builders from the network who are in town for the week.',
    attendees: people(4, 4),
  },
];

/** The owner's upcoming events at the start of each "Events" state. */
export const SEEDED_GOING: Record<'many' | 'few', string[]> = {
  many: ['labweek-lisbon', 'decentralized-ai-dinner', 'storage-summit', 'founders-retreat', 'zk-day', 'funding-the-commons'],
  few: ['labweek-lisbon'],
};

export const PAST_EVENTS: Record<'many' | 'few', PastEvent[]> = {
  many: [
    { uid: 'p1', name: 'LabWeek Bangkok', date: 'Nov 2025', roles: ['Speaker'] },
    { uid: 'p2', name: 'Open Storage Summit', date: 'Oct 2025', roles: [] },
    { uid: 'p3', name: 'Founders Retreat Summer', date: 'Jul 2025', roles: ['Host'] },
    { uid: 'p4', name: 'ZK Research Day', date: 'Jun 2025', roles: [] },
    { uid: 'p5', name: 'Decentralized AI founders dinner', date: 'May 2025', roles: ['Sponsor'] },
    { uid: 'p6', name: 'Funding the Commons', date: 'Mar 2025', roles: [] },
    { uid: 'p7', name: 'Network Builders Breakfast', date: 'Feb 2025', roles: ['Speaker'] },
    { uid: 'p8', name: 'LabWeek Istanbul', date: 'Nov 2024', roles: [] },
    { uid: 'p9', name: 'Open Data Day', date: 'Sep 2024', roles: ['Host', 'Speaker'] },
    { uid: 'p10', name: 'Founders Retreat Winter', date: 'Dec 2023', roles: [] },
  ],
  few: [
    { uid: 'p1', name: 'LabWeek Bangkok', date: 'Nov 2025', roles: ['Speaker'] },
    { uid: 'p2', name: 'Open Storage Summit', date: 'Oct 2025', roles: [] },
  ],
};

export const DEMO_DAY: DemoDay = { title: 'Demo Day F25', date: 'Oct 2025', slug: 'f25' };

/** The person who views the drawer and presses "I'm going" in the drawer view. */
export const YOU: Attendee = { uid: 'you', name: 'You', team: 'Lattice Compute' };

export function eventByUid(uid: string): UpcomingEvent {
  return UPCOMING_EVENTS.find((e) => e.uid === uid) ?? UPCOMING_EVENTS[0];
}

export const month = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
export const day = (iso: string) => new Date(`${iso}T12:00:00`).getDate();
export const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
