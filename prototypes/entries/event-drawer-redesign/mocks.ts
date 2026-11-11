import {
  EVENT_DETAILS,
  EVENT_THUMBS,
  GATHERINGS,
  GOING_EVENTS,
  type EventDetail,
  type Gathering,
  type GoingEvent,
} from '../member-events-going/mocks';

/**
 * Every event the calendar and the drawer know about. The six `member-events-going`
 * events (Home's rail draws four of them) plus five more, so November on the
 * calendar looks like a real month. Extras outside a gathering have no
 * `gatheringUid`: the drawer then has no "Part of the … gathering" block and no
 * "Add your plans", whose question is about a city.
 */
export interface CalEvent {
  uid: string;
  name: string;
  /** ISO day of the first and last day. */
  startDate: string;
  endDate: string;
  range: string;
  city: string;
  gatheringUid?: string;
  attendeeCount: number;
}

const fromGoing = (e: GoingEvent): CalEvent => ({
  ...e,
  city: GATHERINGS.find((g) => g.uid === e.gatheringUid)?.city ?? '',
});

const EXTRA_EVENTS: CalEvent[] = [
  {
    uid: 'pl-founder-office-hours',
    name: 'PL Founders Office Hours',
    startDate: '2026-11-12',
    endDate: '2026-11-12',
    range: 'Nov 12',
    city: 'Online',
    attendeeCount: 31,
  },
  {
    uid: 'fil-dev-summit',
    name: 'Filecoin Dev Summit',
    startDate: '2026-11-16',
    endDate: '2026-11-17',
    range: 'Nov 16–17',
    city: 'Buenos Aires',
    attendeeCount: 46,
  },
  {
    uid: 'dai-summit-bangalore',
    name: 'Decentralized AI Summit',
    startDate: '2026-11-24',
    endDate: '2026-11-25',
    range: 'Nov 24–25',
    city: 'Bangalore',
    attendeeCount: 38,
  },
  {
    uid: 'neurotech-salon',
    name: 'Neurotech Salon',
    startDate: '2026-11-27',
    endDate: '2026-11-27',
    range: 'Nov 27',
    city: 'San Francisco',
    attendeeCount: 14,
  },
];

const TAG = {
  ai: { name: 'AI', color: '#00897B' },
  talks: { name: 'Talks & Presentation', color: '#8E24AA' },
  hackathon: { name: 'Hackathon', color: '#D81B60' },
  conference: { name: 'Conference', color: '#1E88E5' },
  networking: { name: 'Networking', color: '#3949AB' },
  workshop: { name: 'Workshop', color: '#6D4C41' },
  filecoin: { name: 'Filecoin', color: '#0090FF' },
  neuro: { name: 'Neurotech', color: '#F4511E' },
};

const EXTRA_DETAILS: Record<string, EventDetail> = {
  'pl-founder-office-hours': {
    mode: 'Virtual',
    access: 'FREE w/ RSVP',
    dateLine: '12th Nov 2026, 17:00 - 12th Nov 2026, 18:30 (UTC +0:00)',
    address: 'Google Meet',
    region: 'Online',
    tags: [TAG.networking, TAG.workshop],
    hosts: ['Protocol Labs'],
    description: [
      'Monthly open office hours for portfolio founders: fundraising, hiring and go-to-market questions, answered by the PL Venture team and two founders who have been through it.',
      'Bring one question. Sessions are not recorded.',
    ],
    agenda: [],
  },
  'fil-dev-summit': {
    mode: 'Hybrid',
    access: 'FREE w/ RSVP',
    dateLine: '16th Nov 2026, 09:30 - 17th Nov 2026, 18:00 (UTC -3:00)',
    address: 'Centro Cultural Konex, Sarmiento 3131, C1196 Buenos Aires, Argentina',
    region: 'Buenos Aires, Buenos Aires, Argentina',
    tags: [TAG.filecoin, TAG.conference, TAG.talks],
    hosts: ['Filecoin Foundation', 'Protocol Labs'],
    description: [
      'Two days for the people building Filecoin: core devs, storage providers and the teams shipping on top. Day one is the roadmap; day two is working groups.',
    ],
    agenda: [
      {
        day: 'Day 1 - 16th Nov Mon',
        items: [
          { time: '9:30 AM - 10:30 AM', title: 'Opening and network roadmap' },
          { time: '11:00 AM - 6:00 PM', title: 'Talks', about: 'Fast finality, proofs, and the retrieval market' },
        ],
      },
      {
        day: 'Day 2 - 17th Nov Tue',
        items: [{ time: '10:00 AM - 6:00 PM', title: 'Working groups', about: 'Onramps, FVM tooling, and storage SLAs' }],
      },
    ],
  },
  'dai-summit-bangalore': {
    mode: 'In-Person',
    access: 'PAID',
    dateLine: '24th Nov 2026, 09:00 - 25th Nov 2026, 18:00 (UTC +5:30)',
    address: 'Bangalore International Centre, 7, 4th Main Rd, Domlur, Bengaluru 560071, India',
    region: 'Bengaluru, Karnataka, India',
    tags: [TAG.ai, TAG.conference],
    hosts: ['Protocol Labs'],
    description: [
      'Compute markets, verifiable inference and open models: two days with the teams building decentralized AI in India and beyond.',
    ],
    agenda: [],
  },
  'neurotech-salon': {
    mode: 'In-Person',
    access: 'INVITE ONLY',
    dateLine: '27th Nov 2026, 18:30 - 27th Nov 2026, 22:00 (UTC -8:00)',
    address: 'The Commons, 1 Ferry Building, San Francisco, CA 94111, USA',
    region: 'San Francisco, California, United States',
    tags: [TAG.neuro, TAG.networking],
    hosts: ['PL Neurotech'],
    description: [
      'An evening with neurotech founders and researchers from the PL Neurotech portfolio. Short demos, then dinner.',
    ],
    agenda: [],
  },
};

export const CAL_EVENTS: CalEvent[] = [...GOING_EVENTS.map(fromGoing), ...EXTRA_EVENTS].sort((a, b) =>
  a.startDate.localeCompare(b.startDate),
);

export const DETAILS: Record<string, EventDetail> = { ...EVENT_DETAILS, ...EXTRA_DETAILS };

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=160&h=160&q=70&auto=format&fit=crop`;

/** The event's own picture, the drawer's thumbnail. No picture, no thumbnail. */
export const THUMBS: Record<string, string> = {
  ...EVENT_THUMBS,
  'pl-founder-office-hours': unsplash('1528605248644-14dd04022da1'), // small group talking
  'fil-dev-summit': unsplash('1511578314322-379afb476865'), // event hall
  'dai-summit-bangalore': unsplash('1475721027785-f74eccf877e2'), // speaker on stage
  'neurotech-salon': unsplash('1515187029135-18ee286d815b'), // people round a table
};

export const eventByUid = (uid: string) => CAL_EVENTS.find((e) => e.uid === uid) ?? null;

export const gatheringFor = (event: CalEvent): Gathering | null =>
  event.gatheringUid ? (GATHERINGS.find((g) => g.uid === event.gatheringUid) ?? null) : null;

export const siblingsOf = (event: CalEvent) =>
  event.gatheringUid ? CAL_EVENTS.filter((e) => e.gatheringUid === event.gatheringUid) : [event];

/** The events app's page for an event (the drawer's "Open in PL Events"). */
export const eventsAppHref = (uid: string) => `https://events.plnetwork.io/calendar?event=${uid}`;

/** Where "Register" goes: each event's own registration (mocked to the events app). */
export const registerHref = (uid: string) => `https://events.plnetwork.io/register/${uid}`;
