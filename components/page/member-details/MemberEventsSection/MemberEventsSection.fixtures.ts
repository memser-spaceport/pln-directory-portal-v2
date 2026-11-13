import type { MemberProfileEvent, ProfileEventPerson } from '@/services/events/profile-events.types';

/* `GET /v1/members/:uid/events` items for the story and the tests (LAB-3217), in the prototype's events. */

export const FACES: ProfileEventPerson[] = [
  { uid: 'f1', name: 'Juan Benet', image: null },
  { uid: 'f2', name: 'Molly Mackinlay', image: null },
  { uid: 'f3', name: 'Ana Lima', image: null },
];

export function memberEvent(overrides: Partial<MemberProfileEvent> & Pick<MemberProfileEvent, 'uid' | 'name'>) {
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
    faces: FACES,
    viewerGoing: false,
    showOnProfile: true,
    ...overrides,
  } satisfies MemberProfileEvent;
}

export const UPCOMING: MemberProfileEvent[] = [
  memberEvent({
    uid: 'up-1',
    name: 'FIL Berlin',
    startDate: '2026-11-18T00:00:00.000Z',
    endDate: '2026-11-20T00:00:00.000Z',
    roles: ['Speaker'],
    goingCount: 42,
    viewerGoing: true,
  }),
  memberEvent({ uid: 'up-2', name: 'Funding the Commons', startDate: '2026-12-04T00:00:00.000Z', goingCount: 7 }),
];

export const PAST: MemberProfileEvent[] = [
  memberEvent({
    uid: 'past-1',
    name: 'Founders Forum',
    startDate: '2026-03-12T00:00:00.000Z',
    endDate: '2026-03-12T00:00:00.000Z',
    location: 'Lisbon, Portugal',
    city: 'Lisbon',
    roles: ['Speaker'],
  }),
  memberEvent({
    uid: 'past-2',
    name: 'LabWeek Istanbul',
    startDate: '2025-11-13T00:00:00.000Z',
    endDate: '2025-11-17T00:00:00.000Z',
    location: 'Istanbul, Türkiye',
    city: 'Istanbul',
    roles: ['Host'],
  }),
  memberEvent({
    uid: 'past-3',
    name: 'Protocol Labs Summit',
    startDate: '2025-06-02T00:00:00.000Z',
    endDate: '2025-06-02T00:00:00.000Z',
    location: 'Lisbon, Portugal',
    city: 'Lisbon',
  }),
];

/** Seven past events, newest first, for "Show all 7 past events". */
export const SEVEN_PAST: MemberProfileEvent[] = Array.from({ length: 7 }, (_, i) =>
  memberEvent({
    uid: `past-${i + 1}`,
    name: `Past event ${i + 1}`,
    startDate: new Date(Date.UTC(2026, 6 - i, 10)).toISOString(),
    endDate: new Date(Date.UTC(2026, 6 - i, 10)).toISOString(),
    city: i % 2 ? 'Lisbon' : null,
    roles: i === 0 ? ['Sponsor'] : [],
  }),
);
