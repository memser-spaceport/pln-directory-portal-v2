import type { EventData, EventRole, Resource } from '@/components/core/UpdatesPanel/IrlGatheringModal/types';

/** One event, the row members press. It belongs to a gathering (production's location). */
export interface GoingEvent {
  uid: string;
  name: string;
  /** ISO date of the first day. */
  startDate: string;
  endDate: string;
  /** Short label: "Dec 1–5" or "Dec 3". */
  range: string;
  gatheringUid: string;
  attendeeCount: number;
}

export interface Gathering {
  uid: string;
  city: string;
  about: string;
  timezone: string;
  attendeesCount: number;
  resources: Resource[];
  scheduleLink: string;
}

const resource = (name: string, link: string, type: Resource['type'] = 'social'): Resource => ({
  name,
  link,
  type,
  isPublic: 'true',
  description: null,
});

export const GATHERINGS: Gathering[] = [
  {
    uid: 'lisbon',
    city: 'Lisbon',
    about:
      'A week of builders, founders and funders from across the Protocol Labs network, with side events all over the city.',
    timezone: 'Europe/Lisbon',
    attendeesCount: 64,
    resources: [
      resource('Telegram', 'https://t.me/labweek'),
      resource('Shared notes', 'https://docs.google.com/document/d/labweek', 'custom'),
    ],
    scheduleLink: 'https://events.plnetwork.io/program?location=Lisbon',
  },
  {
    uid: 'berlin',
    city: 'Berlin',
    about: 'Protocol Labs network founders and researchers meeting around decentralized AI in Berlin.',
    timezone: 'Europe/Berlin',
    attendeesCount: 23,
    resources: [resource('Telegram', 'https://t.me/plberlin')],
    scheduleLink: 'https://events.plnetwork.io/program?location=Berlin',
  },
  {
    uid: 'new-york',
    city: 'New York',
    about: 'Filecoin and IPFS builders in New York, with a focus on storage onramps.',
    timezone: 'America/New_York',
    attendeesCount: 12,
    resources: [resource('Telegram', 'https://t.me/filnyc')],
    scheduleLink: 'https://events.plnetwork.io/program?location=New%20York',
  },
  {
    uid: 'san-francisco',
    city: 'San Francisco',
    about: 'Public goods funding, neurotech and AI teams from the network in San Francisco.',
    timezone: 'America/Los_Angeles',
    attendeesCount: 41,
    resources: [resource('Telegram', 'https://t.me/plsf')],
    scheduleLink: 'https://events.plnetwork.io/program?location=San%20Francisco',
  },
];

export const GOING_EVENTS: GoingEvent[] = [
  {
    uid: 'filecoin-builders-ny',
    name: 'Filecoin Builders Meetup',
    startDate: '2026-11-19',
    endDate: '2026-11-19',
    range: 'Nov 19',
    gatheringUid: 'new-york',
    attendeeCount: 12,
  },
  {
    uid: 'labweek-lisbon',
    name: 'LabWeek Lisbon',
    startDate: '2026-12-01',
    endDate: '2026-12-05',
    range: 'Dec 1–5',
    gatheringUid: 'lisbon',
    attendeeCount: 58,
  },
  {
    uid: 'libp2p-day',
    name: 'libp2p Day',
    startDate: '2026-12-03',
    endDate: '2026-12-03',
    range: 'Dec 3',
    gatheringUid: 'lisbon',
    attendeeCount: 27,
  },
  {
    uid: 'ipfs-camp-lisbon',
    name: 'IPFS Camp: Storage Onramps Working Session',
    startDate: '2026-12-04',
    endDate: '2026-12-04',
    range: 'Dec 4',
    gatheringUid: 'lisbon',
    attendeeCount: 19,
  },
  {
    uid: 'dai-founders-dinner',
    name: 'Decentralized AI Founders Dinner',
    startDate: '2027-01-14',
    endDate: '2027-01-14',
    range: 'Jan 14',
    gatheringUid: 'berlin',
    attendeeCount: 23,
  },
  {
    uid: 'funding-commons-sf',
    name: 'Funding the Commons',
    startDate: '2027-02-18',
    endDate: '2027-02-20',
    range: 'Feb 18–20',
    gatheringUid: 'san-francisco',
    attendeeCount: 41,
  },
];

/** The rows Home's rail shows; the rest sit behind "See all". */
export const HOME_RAIL_EVENTS = GOING_EVENTS.slice(0, 4);
export const TOTAL_UPCOMING_EVENTS = 18;

export function gatheringOf(event: GoingEvent): Gathering {
  return GATHERINGS.find((g) => g.uid === event.gatheringUid) ?? GATHERINGS[0];
}

export function eventsOf(gathering: Gathering): GoingEvent[] {
  return GOING_EVENTS.filter((e) => e.gatheringUid === gathering.uid);
}

/** Production's picker reads `EventData`; same facts, its shape. */
export function toEventData(event: GoingEvent): EventData {
  return {
    uid: event.uid,
    name: event.name,
    slug: event.uid,
    startDate: `${event.startDate}T09:00:00.000Z`,
    endDate: `${event.endDate}T18:00:00.000Z`,
    logoUrl: null,
    attendeeCount: event.attendeeCount,
    websiteUrl: null,
  };
}

/** Past events, drawn with the team profile's Contributions tile. More than one row, as real members have. */
export interface PastEvent {
  uid: string;
  name: string;
  date: string;
  roles: Exclude<EventRole, 'Attendee'>[];
}

export const PAST_EVENTS: PastEvent[] = [
  { uid: 'p1', name: 'Protocol Berg v2', date: 'Jun 2026', roles: ['Speaker'] },
  { uid: 'p2', name: 'Funding the Commons Berlin', date: 'May 2026', roles: [] },
  { uid: 'p3', name: 'Founders Retreat', date: 'Mar 2026', roles: ['Host'] },
  { uid: 'p4', name: 'ETHDenver Storage Day', date: 'Feb 2026', roles: [] },
  { uid: 'p5', name: 'LabWeek Singapore', date: 'Oct 2025', roles: ['Speaker', 'Sponsor'] },
  { uid: 'p6', name: 'IPFS Camp', date: 'Jul 2025', roles: [] },
  { uid: 'p7', name: 'libp2p Day Brussels', date: 'Apr 2025', roles: ['Host'] },
];

export interface Attendee {
  uid: string;
  name: string;
  role: string;
  team: string;
  /** Host / Speaker / Sponsor when they have one. */
  tag?: 'Host' | 'Speaker' | 'Sponsor';
}

const FIRST = ['Lucas', 'Nadia', 'Olga', 'Theo', 'Priya', 'Marco', 'Hana', 'Tomás'];
const LAST = ['Moreau', 'Haddad', 'Petrova', 'Larsson', 'Nair', 'Bianchi', 'Sato', 'Reyes'];
const JOBS = ['Founder', 'Protocol Engineer', 'Head of Research', 'Investor', 'Product Lead', 'Co-founder & CTO'];
const TEAMS = ['Lattice Compute', 'Fission Labs', 'Number Zero', 'Textile', 'Ceramic', 'Interplanetary Compute Labs'];

/** A full room: every name pairing, so search and scrolling meet the list the real feature holds. */
export const ATTENDEES: Attendee[] = FIRST.flatMap((first, i) =>
  LAST.map((last, j) => {
    const n = i * LAST.length + j;
    return {
      uid: `${first}-${last}`.toLowerCase(),
      name: `${first} ${last}`,
      role: JOBS[n % JOBS.length],
      team: TEAMS[(n * 5 + i) % TEAMS.length],
      tag: n % 11 === 0 ? 'Host' : n % 7 === 0 ? 'Speaker' : n % 13 === 0 ? 'Sponsor' : undefined,
    } as Attendee;
  }),
);

export const MAYA_TEAMS = [{ id: 'lattice', name: 'Lattice Compute', mainTeam: true }];
