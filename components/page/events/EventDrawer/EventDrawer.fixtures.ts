import type { EventAttendee, EventDetailResponse, MyGatheringPlans } from '@/services/events/event-drawer.types';

/*
 * Wire-shaped fixtures for the event drawer's story and tests (LAB-3216). Content follows the prototype's mocks
 * (`prototypes/entries/member-events-going/mocks.ts`). Dates are far in the future so the events stay "upcoming".
 */

export const LISBON_UID = 'loc-lisbon';

export const LISBON_EVENTS = [
  {
    uid: 'labweek-lisbon',
    name: 'LabWeek Lisbon',
    type: 'IN_PERSON',
    startDate: '2030-12-01T09:00:00.000Z',
    endDate: '2030-12-05T18:00:00.000Z',
  },
  {
    uid: 'libp2p-day',
    name: 'libp2p Day',
    type: 'IN_PERSON',
    startDate: '2030-12-03T10:00:00.000Z',
    endDate: '2030-12-03T18:00:00.000Z',
  },
  {
    uid: 'lisbon-founders-day',
    name: 'Lisbon Founders Day',
    type: 'IN_PERSON',
    startDate: '2030-12-04T09:00:00.000Z',
    endDate: '2030-12-04T17:00:00.000Z',
  },
];

export function eventResponse(overrides: Partial<EventDetailResponse> = {}): EventDetailResponse {
  return {
    uid: 'labweek-lisbon',
    name: 'LabWeek Lisbon',
    slugURL: 'labweek-lisbon',
    type: 'IN_PERSON',
    startDate: '2030-12-01T09:00:00.000Z',
    endDate: '2030-12-05T18:00:00.000Z',
    description:
      'A week of builders, founders and funders from across the Protocol Labs network, with side events all over the city.\n\nThe main stage runs Tuesday to Thursday: talks on decentralized AI, storage, networking and funding public goods.',
    shortDescription: null,
    logo: null,
    banner: null,
    websiteUrl: 'https://labweek.io',
    externalId: 'ext-1',
    resources: [],
    location: {
      uid: LISBON_UID,
      location: 'Lisbon, Portugal',
      city: 'Lisbon',
      flag: null,
      timezone: 'Europe/Lisbon',
      resources: [
        { type: 'social', name: 'Telegram', link: 'https://t.me/labweek', isPublic: true, description: null },
        {
          type: 'custom',
          name: 'Shared notes',
          link: 'https://docs.google.com/document/d/labweek',
          isPublic: true,
          description: null,
        },
      ],
      events: LISBON_EVENTS,
    },
    details: {
      tags: [
        { name: 'Conference', color: null },
        { name: 'AI', color: null },
      ],
      accessType: null,
      accessOption: 'OPEN',
      format: 'IN-PERSON',
      host: { name: 'Protocol Labs', logo: null },
      coHosts: [],
      sponsors: [],
      agenda: {
        sessions: [
          {
            name: 'Registration and coffee',
            start_date: '2030-12-01T09:00:00.000Z',
            end_date: '2030-12-01T10:00:00.000Z',
            description: '',
          },
          {
            name: 'Main stage',
            start_date: '2030-12-01T10:00:00.000Z',
            end_date: '2030-12-01T18:00:00.000Z',
            description: 'Opening keynote, state of the network, and decentralized AI track',
          },
          {
            name: 'Main stage',
            start_date: '2030-12-02T10:00:00.000Z',
            end_date: '2030-12-02T18:00:00.000Z',
            description: 'Storage, networking, and funding the commons',
          },
        ],
      },
    },
    hosts: [],
    goingCount: 40,
    faces: [
      { uid: 'm-1', name: 'Ana Silva', image: null },
      { uid: 'm-2', name: 'Ben Ortiz', image: null },
      { uid: 'm-3', name: 'Chen Wei', image: null },
    ],
    viewerGoing: false,
    viewer: null,
    ...overrides,
  };
}

/** The same event without tags, agenda, hosts or description. */
export function bareEventResponse(overrides: Partial<EventDetailResponse> = {}): EventDetailResponse {
  return eventResponse({
    description: null,
    details: {
      tags: [],
      accessType: null,
      accessOption: null,
      format: null,
      host: null,
      coHosts: [],
      sponsors: [],
      agenda: null,
    },
    ...overrides,
  });
}

export const ATTENDEES: EventAttendee[] = [
  { memberUid: 'viewer-1', name: 'Maya Okonkwo', image: null, role: 'Founder', teamName: 'Atlas', roles: [] },
  { memberUid: 'm-1', name: 'Ana Silva', image: null, role: 'CEO', teamName: 'Lighthouse', roles: ['Host'] },
  { memberUid: 'm-2', name: 'Ben Ortiz', image: null, role: 'Engineer', teamName: 'Lighthouse', roles: [] },
  { memberUid: 'm-3', name: 'Chen Wei', image: null, role: 'Researcher', teamName: 'Lighthouse', roles: ['Speaker'] },
  { memberUid: 'm-4', name: 'Dana Kim', image: null, role: 'Designer', teamName: 'Fission', roles: [] },
];

export const NO_PLANS: MyGatheringPlans = {
  eventUids: [],
  eventRoles: [],
  topics: [],
  reason: '',
  teamUid: null,
  checkInDate: null,
  checkOutDate: null,
  telegramId: null,
  officeHours: null,
};

export const GOING_PLANS: MyGatheringPlans = {
  eventUids: ['labweek-lisbon', 'libp2p-day'],
  eventRoles: [
    { eventUid: 'labweek-lisbon', roles: ['Attendee'] },
    { eventUid: 'libp2p-day', roles: ['Speaker'] },
  ],
  topics: ['AI'],
  reason: 'Happy to talk storage.',
  teamUid: null,
  checkInDate: '2030-12-01',
  checkOutDate: '2030-12-05',
  telegramId: '@mayaokonkwo',
  officeHours: null,
};
