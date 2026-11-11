import type {
  ProfileEventPerson,
  TeamPastEvent,
  TeamProfileDemoDay,
  TeamProfileEvent,
} from '@/services/events/profile-events.types';

/* `GET /v1/teams/:uid/events` items for the story and the tests (LAB-3219), in the prototype's events. */

export const TEAM_NAME = 'Lighthouse';

export const TEAMMATES: ProfileEventPerson[] = [
  { uid: 'm1', name: 'Juan Benet', image: null },
  { uid: 'm2', name: 'Molly Mackinlay', image: null },
  { uid: 'm3', name: 'Ana Lima', image: null },
];

export function pastEvent(overrides: Partial<TeamPastEvent> & Pick<TeamPastEvent, 'uid' | 'name'>) {
  return {
    kind: 'event',
    type: null,
    startDate: '2026-11-18T00:00:00.000Z',
    endDate: '2026-11-18T00:00:00.000Z',
    logo: null,
    locationUid: 'loc-berlin',
    location: 'Berlin, Germany',
    city: 'Berlin',
    roles: [],
    goingCount: 12,
    faces: TEAMMATES,
    viewerGoing: false,
    ...overrides,
  } satisfies TeamPastEvent;
}

export function teamEvent(overrides: Partial<TeamProfileEvent> & Pick<TeamProfileEvent, 'uid' | 'name'>) {
  return { ...pastEvent(overrides), memberCount: 3, members: TEAMMATES, ...overrides } satisfies TeamProfileEvent;
}

export const DEMO_DAY: TeamProfileDemoDay = {
  kind: 'demo-day',
  uid: 'dd-1',
  title: 'PL Demo Day, June 2026',
  slug: 'june-2026',
  startDate: '2026-06-18T00:00:00.000Z',
  endDate: '2026-06-18T00:00:00.000Z',
};

export const TEAM_UPCOMING: TeamProfileEvent[] = [
  teamEvent({
    uid: 'up-1',
    name: 'FIL Berlin',
    startDate: '2026-11-18T00:00:00.000Z',
    endDate: '2026-11-20T00:00:00.000Z',
    roles: ['Sponsor'],
    viewerGoing: true,
  }),
  teamEvent({
    uid: 'up-2',
    name: 'Funding the Commons',
    startDate: '2026-12-04T00:00:00.000Z',
    memberCount: 1,
    members: TEAMMATES.slice(0, 1),
  }),
];

export const TEAM_PAST: (TeamProfileDemoDay | TeamPastEvent)[] = [
  DEMO_DAY,
  pastEvent({
    uid: 'past-1',
    name: 'LabWeek Lisbon',
    startDate: '2026-09-10T00:00:00.000Z',
    endDate: '2026-09-12T00:00:00.000Z',
    location: 'Lisbon, Portugal',
    city: 'Lisbon',
    roles: ['Host'],
  }),
  pastEvent({
    uid: 'past-2',
    name: 'Founders Forum',
    startDate: '2026-03-12T00:00:00.000Z',
    endDate: '2026-03-12T00:00:00.000Z',
    location: 'Istanbul, Türkiye',
    city: 'Istanbul',
  }),
];
