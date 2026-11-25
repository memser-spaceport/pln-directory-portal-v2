import type { AllEventsItem } from '@/services/events/all-events.types';

/** One All Events item for tests (LAB-3247): an in-person Lisbon event on 2030-12-03, free. */
export function allEventsItem(over: Partial<AllEventsItem> = {}): AllEventsItem {
  const city = over.city === undefined ? 'Lisbon' : over.city;
  return {
    uid: 'e1',
    name: 'LabWeek',
    startDate: '2030-12-03T09:00:00.000Z',
    endDate: '2030-12-03T18:00:00.000Z',
    allDay: false,
    timezone: 'UTC',
    startDay: '2030-12-03',
    endDay: '2030-12-03',
    startTime: '9:00 AM',
    endTime: '6:00 PM',
    zone: 'UTC+0',
    city,
    cityKey: city ? city.toLowerCase() : null,
    place: city ? `${city}, Portugal` : null,
    mode: 'In-Person',
    access: null,
    hosts: [],
    focusAreas: [],
    tags: [],
    featured: false,
    picture: null,
    goingCount: 0,
    faces: [],
    ...over,
  };
}
