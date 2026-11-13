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

/** One event as the PL events app describes it (its detail panel's fields). */
export interface EventDetail {
  mode: 'In-Person' | 'Virtual' | 'Hybrid';
  access: 'PAID' | 'FREE w/ RSVP' | 'INVITE ONLY';
  dateLine: string;
  address: string;
  region: string;
  tags: { name: string; color: string }[];
  hosts: string[];
  description: string[];
  agenda: { day: string; items: { time: string; title: string; about?: string }[] }[];
}

const TAG = {
  ai: { name: 'AI', color: '#00897B' },
  talks: { name: 'Talks & Presentation', color: '#8E24AA' },
  hackathon: { name: 'Hackathon', color: '#D81B60' },
  conference: { name: 'Conference', color: '#1E88E5' },
  networking: { name: 'Networking', color: '#3949AB' },
  workshop: { name: 'Workshop', color: '#6D4C41' },
  dinner: { name: 'Dinner', color: '#E53935' },
  filecoin: { name: 'Filecoin', color: '#0090FF' },
};

const LISBON_VENUE = {
  address: 'Hub Criativo do Beato, R. da Manutenção 71, 1900-500 Lisboa, Portugal',
  region: 'Lisbon, Lisbon, Portugal',
};

export const EVENT_DETAILS: Record<string, EventDetail> = {
  'filecoin-builders-ny': {
    mode: 'In-Person',
    access: 'FREE w/ RSVP',
    dateLine: '19th Nov 2026, 18:00 - 19th Nov 2026, 21:00 (UTC -5:00)',
    address: 'Betaworks, 29 Little W 12th St, New York, NY 10014, USA',
    region: 'New York, New York, United States',
    tags: [TAG.filecoin, TAG.talks, TAG.networking],
    hosts: ['Filecoin Foundation'],
    description: [
      'An evening for teams building storage onramps, retrieval and data tooling on Filecoin. Three short demos, then an open floor for what is blocking you in production.',
      'Bring a laptop if you want to show something. Food and drinks from 18:00.',
    ],
    agenda: [
      {
        day: 'Day 1 - 19th Nov Thu',
        items: [
          { time: '6:00 PM - 6:45 PM', title: 'Doors and dinner' },
          {
            time: '6:45 PM - 8:00 PM',
            title: 'Demos',
            about: 'Onramp latency, retrieval markets, and a storage client for agents',
          },
          { time: '8:00 PM - 9:00 PM', title: 'Open floor' },
        ],
      },
    ],
  },
  'labweek-lisbon': {
    mode: 'In-Person',
    access: 'PAID',
    dateLine: '1st Dec 2026, 09:00 - 5th Dec 2026, 18:00 (UTC +0:00)',
    ...LISBON_VENUE,
    tags: [TAG.conference, TAG.ai, TAG.talks],
    hosts: ['Protocol Labs'],
    description: [
      'A week of builders, founders and funders from across the Protocol Labs network, with side events all over the city.',
      'The main stage runs Tuesday to Thursday: talks on decentralized AI, storage, networking and funding public goods, plus office hours with PL teams. Side events, dinners and working sessions fill the rest of the week.',
    ],
    agenda: [
      {
        day: 'Day 1 - 1st Dec Tue',
        items: [
          { time: '9:00 AM - 10:00 AM', title: 'Registration and coffee' },
          {
            time: '10:00 AM - 6:00 PM',
            title: 'Main stage',
            about: 'Opening keynote, state of the network, and decentralized AI track',
          },
        ],
      },
      {
        day: 'Day 2 - 2nd Dec Wed',
        items: [
          { time: '10:00 AM - 6:00 PM', title: 'Main stage', about: 'Storage, networking, and funding the commons' },
        ],
      },
    ],
  },
  'libp2p-day': {
    mode: 'In-Person',
    access: 'FREE w/ RSVP',
    dateLine: '3rd Dec 2026, 10:00 - 3rd Dec 2026, 18:00 (UTC +0:00)',
    ...LISBON_VENUE,
    tags: [TAG.talks, TAG.hackathon],
    hosts: ['libp2p'],
    description: [
      'A day for people building on and with libp2p: implementation updates from the Go, Rust and JS teams, then an afternoon hack on WebTransport and browser-to-browser connectivity.',
    ],
    agenda: [
      {
        day: 'Day 1 - 3rd Dec Thu',
        items: [
          { time: '10:00 AM - 1:00 PM', title: 'Implementation updates' },
          {
            time: '2:00 PM - 6:00 PM',
            title: 'Hack session',
            about: 'WebTransport, WebRTC, and the new connection manager',
          },
        ],
      },
    ],
  },
  'ipfs-camp-lisbon': {
    mode: 'In-Person',
    access: 'INVITE ONLY',
    dateLine: '4th Dec 2026, 13:00 - 4th Dec 2026, 17:00 (UTC +0:00)',
    ...LISBON_VENUE,
    tags: [TAG.workshop, TAG.filecoin],
    hosts: ['IPFS Foundation', 'Filecoin Foundation'],
    description: [
      'A working session for teams running storage onramps. We will compare retrieval numbers, agree a shared benchmark, and write down the three fixes that would help everyone most.',
    ],
    agenda: [],
  },
  'dai-founders-dinner': {
    mode: 'In-Person',
    access: 'INVITE ONLY',
    dateLine: '14th Jan 2027, 19:00 - 14th Jan 2027, 22:30 (UTC +1:00)',
    address: 'Remi, Schönhauser Allee 6, 10119 Berlin, Germany',
    region: 'Berlin, Berlin, Germany',
    tags: [TAG.dinner, TAG.ai],
    hosts: ['Protocol Labs'],
    description: [
      'A dinner for founders working on decentralized AI: compute markets, verifiable inference and data provenance. Twenty seats, no talks, one long table.',
    ],
    agenda: [],
  },
  'funding-commons-sf': {
    mode: 'In-Person',
    access: 'PAID',
    dateLine: '18th Feb 2027, 09:00 - 20th Feb 2027, 18:00 (UTC -8:00)',
    address: 'The Fold, 3359 26th St, San Francisco, CA 94110, USA',
    region: 'San Francisco, California, United States',
    tags: [TAG.ai, TAG.conference],
    hosts: ['Funding the Commons'],
    description: [
      'Redefining institutions, infrastructure, and public goods in the age of AI.',
      'Three days of researchers, economists, policymakers, engineers, artists and funders around one question: as AI amasses the largest fortunes since the industrial age, how will that wealth be distributed, and who decides?',
    ],
    agenda: [
      {
        day: 'Day 1 - 18th Feb Thu',
        items: [
          {
            time: '9:00 AM - 6:00 PM',
            title: 'Funding the Commons Forum',
            about: 'Open models, funding mechanisms, and working prototypes',
          },
        ],
      },
    ],
  },
};

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=160&h=160&q=70&auto=format&fit=crop`;

/**
 * The event's own picture, shown as the drawer's thumbnail (the events app's
 * cover image). An event without one draws no thumbnail, not a placeholder.
 */
export const EVENT_THUMBS: Record<string, string> = {
  'filecoin-builders-ny': unsplash('1515187029135-18ee286d815b'), // meetup round a table
  'labweek-lisbon': unsplash('1540575467063-178a50c2df87'), // conference audience
  'libp2p-day': unsplash('1475721027785-f74eccf877e2'), // speaker on stage
  'ipfs-camp-lisbon': unsplash('1522071820081-009f0129c71c'), // working session
  'dai-founders-dinner': unsplash('1414235077428-338989a2e8c0'), // dinner table
  'funding-commons-sf': unsplash('1505373877841-8d25f7d46678'), // conference hall
};

/** Past events, drawn with the team profile's Contributions tile. More than one row, as real members have. */
export interface PastEvent {
  uid: string;
  name: string;
  date: string;
  /** The gathering's city: production's event.location.location, up to the comma. */
  city: string;
  roles: Exclude<EventRole, 'Attendee'>[];
}

export const PAST_EVENTS: PastEvent[] = [
  { uid: 'p1', name: 'Protocol Berg v2', date: 'Jun 2026', city: 'Berlin', roles: ['Speaker'] },
  { uid: 'p2', name: 'Funding the Commons Berlin', date: 'May 2026', city: 'Berlin', roles: [] },
  { uid: 'p3', name: 'Founders Retreat', date: 'Mar 2026', city: 'Lisbon', roles: ['Host'] },
  { uid: 'p4', name: 'ETHDenver Storage Day', date: 'Feb 2026', city: 'Denver', roles: [] },
  { uid: 'p5', name: 'LabWeek Singapore', date: 'Oct 2025', city: 'Singapore', roles: ['Speaker', 'Sponsor'] },
  { uid: 'p6', name: 'IPFS Camp', date: 'Jul 2025', city: 'Lisbon', roles: [] },
  { uid: 'p7', name: 'libp2p Day Brussels', date: 'Apr 2025', city: 'Brussels', roles: ['Host'] },
];

/**
 * The team profile's upcoming events: the ones its members are going to and
 * show on their profiles, with any role the team itself holds.
 */
export interface TeamUpcoming {
  eventUid: string;
  roles: Exclude<EventRole, 'Attendee'>[];
  /** The team's members going, by name. */
  members: string[];
}

export const TEAM_UPCOMING: TeamUpcoming[] = [
  { eventUid: 'labweek-lisbon', roles: ['Host'], members: ['Juan Benet', 'Molly Mackinlay', 'David Dias', 'Steven Allen'] },
  { eventUid: 'libp2p-day', roles: ['Sponsor', 'Speaker'], members: ['David Dias', 'Steven Allen'] },
  { eventUid: 'filecoin-builders-ny', roles: [], members: ['Molly Mackinlay'] },
  { eventUid: 'funding-commons-sf', roles: ['Speaker'], members: ['Juan Benet', 'Devon Park', 'Lina Suarez'] },
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
