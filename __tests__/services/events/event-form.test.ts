import {
  agendaIssue,
  checkEventForm,
  defaultEventFormValues,
  EVENT_FORM_TEXT,
  fromContactInfos,
  fromInstant,
  groupAgendaByDay,
  isEndTimeDisabled,
  isStartTimeDisabled,
  moveAgendaToTimezone,
  normalizeSocialHandle,
  pickEndDay,
  pickStartDay,
  TIME_OPTIONS,
  toEventBody,
  toInstant,
} from '@/services/events/event-form';
import type { EventFormValues } from '@/services/events/event-submission.types';

/* The event form's rules: dates and times, the wall-clock mapping, the checks with their texts, and the body. */

const valid = (over: Partial<EventFormValues> = {}): EventFormValues => ({
  ...defaultEventFormValues('Europe/Lisbon'),
  name: 'Lisbon Meetup',
  startDay: '2030-01-28',
  startTime: '09:00',
  endDay: '2030-01-28',
  endTime: '18:00',
  hostName: 'Protocol Labs',
  ...over,
});

const session = (name: string, start: string, end: string) => ({ name, start_date: start, end_date: end });

describe('defaults', () => {
  it('starts as a free, in-person event with the first tag and the given time zone', () => {
    expect(defaultEventFormValues('Europe/Lisbon')).toMatchObject({
      accessOption: 'OPEN',
      format: 'IN_PERSON',
      tags: ['Talks & Presentation'],
      timezone: 'Europe/Lisbon',
      coHosts: [],
      logo: null,
    });
  });
});

describe('dates and times', () => {
  it('lists the day in 15-minute steps', () => {
    expect(TIME_OPTIONS).toHaveLength(96);
    expect(TIME_OPTIONS[0]).toEqual({ value: '00:00', label: '12:00 AM' });
    expect(TIME_OPTIONS[49]).toEqual({ value: '12:15', label: '12:15 PM' });
    expect(TIME_OPTIONS[95]).toEqual({ value: '23:45', label: '11:45 PM' });
  });

  it('resets the time to 12:00 AM when a date is picked', () => {
    const values = { startDay: '2030-12-01', startTime: '10:00', endDay: '2030-12-05', endTime: '17:00' };
    expect(pickStartDay(values, '2030-12-03')).toMatchObject({ startDay: '2030-12-03', startTime: '00:00' });
    expect(pickEndDay(values, '2030-12-04')).toMatchObject({ endDay: '2030-12-04', endTime: '00:00' });
  });

  it('sets the end time to 23:45 when the end day is the start day', () => {
    const values = { startDay: '2030-12-03', startTime: '10:00', endDay: '', endTime: '00:00' };
    expect(pickEndDay(values, '2030-12-03')).toMatchObject({ endDay: '2030-12-03', endTime: '23:45' });
    expect(pickStartDay({ ...values, startDay: '', endDay: '2030-12-03' }, '2030-12-03')).toMatchObject({
      startTime: '00:00',
      endTime: '23:45',
    });
  });

  it('disables impossible times on one day only', () => {
    const sameDay = { startDay: '2030-12-03', startTime: '10:00', endDay: '2030-12-03', endTime: '18:00' };
    expect(isEndTimeDisabled(sameDay, '10:00')).toBe(true);
    expect(isEndTimeDisabled(sameDay, '09:45')).toBe(true);
    expect(isEndTimeDisabled(sameDay, '10:15')).toBe(false);
    expect(isStartTimeDisabled(sameDay, '18:00')).toBe(true);
    expect(isStartTimeDisabled(sameDay, '17:45')).toBe(false);
    const twoDays = { ...sameDay, endDay: '2030-12-04' };
    expect(isEndTimeDisabled(twoDays, '09:00')).toBe(false);
    expect(isStartTimeDisabled(twoDays, '23:45')).toBe(false);
  });
});

describe('wall clock ↔ instant', () => {
  it('maps a clock time in two time zones', () => {
    expect(toInstant('2030-01-28', '10:00', 'Europe/Lisbon')).toBe('2030-01-28T10:00:00.000Z');
    expect(toInstant('2030-01-28', '10:00', 'Asia/Tokyo')).toBe('2030-01-28T01:00:00.000Z');
    expect(fromInstant('2030-01-28T01:00:00.000Z', 'Asia/Tokyo')).toEqual({ day: '2030-01-28', time: '10:00' });
    expect(fromInstant('2030-01-28T01:00:00.000Z', 'Europe/Lisbon')).toEqual({ day: '2030-01-28', time: '01:00' });
  });

  it('keeps the clock time across a daylight-saving change', () => {
    // Lisbon moves from UTC+0 to UTC+1 on 2030-03-31.
    expect(toInstant('2030-03-30', '09:00', 'Europe/Lisbon')).toBe('2030-03-30T09:00:00.000Z');
    expect(toInstant('2030-03-31', '09:00', 'Europe/Lisbon')).toBe('2030-03-31T08:00:00.000Z');
    expect(fromInstant('2030-03-31T08:00:00.000Z', 'Europe/Lisbon')).toEqual({ day: '2030-03-31', time: '09:00' });
    // New York moves from UTC-4 to UTC-5 on 2030-11-03.
    expect(toInstant('2030-11-02', '09:00', 'America/New_York')).toBe('2030-11-02T13:00:00.000Z');
    expect(toInstant('2030-11-03', '09:00', 'America/New_York')).toBe('2030-11-03T14:00:00.000Z');
  });

  it('reads a bad instant as no date', () => {
    expect(fromInstant('nope', 'UTC')).toEqual({ day: '', time: '00:00' });
  });
});

describe('agenda', () => {
  const agenda = {
    sessions: [
      session('Lunch', '2030-01-29T12:00:00.000Z', '2030-01-29T13:00:00.000Z'),
      session('Opening Ceremony', '2030-01-28T10:00:00.000Z', '2030-01-28T10:30:00.000Z'),
    ],
    agendaSummary: 'text',
  };

  it('groups sessions by day in the event time zone, earliest first', () => {
    expect(groupAgendaByDay(agenda, 'Europe/Lisbon')).toEqual([
      {
        label: 'Day 1',
        date: 'Jan 28, Mon',
        items: [{ time: '10:00 AM – 10:30 AM', title: 'Opening Ceremony', description: null }],
      },
      {
        label: 'Day 2',
        date: 'Jan 29, Tue',
        items: [{ time: '12:00 PM – 1:00 PM', title: 'Lunch', description: null }],
      },
    ]);
  });

  it('keeps each session’s clock time when the time zone changes', () => {
    const moved = moveAgendaToTimezone(agenda, 'Europe/Lisbon', 'Asia/Tokyo');
    expect(moved?.sessions[1]).toMatchObject({
      start_date: '2030-01-28T01:00:00.000Z',
      end_date: '2030-01-28T01:30:00.000Z',
      timezone: 'Asia/Tokyo',
    });
    expect(groupAgendaByDay(moved, 'Asia/Tokyo')[0].items[0].time).toBe('10:00 AM – 10:30 AM');
    expect(moveAgendaToTimezone(agenda, 'UTC', 'UTC')).toBe(agenda);
    expect(moveAgendaToTimezone(null, 'UTC', 'Asia/Tokyo')).toBeNull();
  });

  const start = '2030-01-28T09:00:00.000Z';
  const end = '2030-01-28T18:00:00.000Z';
  const issue = (s: ReturnType<typeof session>) => agendaIssue([s], start, end, 'Europe/Lisbon');

  it('accepts sessions inside the event', () => {
    expect(issue(session('Opening', '2030-01-28T10:00:00.000Z', '2030-01-28T10:30:00.000Z'))).toBeNull();
  });

  it('names a session after the event ends', () => {
    expect(issue(session('Afterparty', '2030-01-29T20:00:00.000Z', '2030-01-29T22:00:00.000Z'))).toBe(
      '"Afterparty" is on Jan 29, but your event ends Jan 28. Check the date.',
    );
  });

  it('names a session before the event starts', () => {
    expect(issue(session('Warm-up', '2030-01-27T10:00:00.000Z', '2030-01-27T11:00:00.000Z'))).toBe(
      '"Warm-up" is on Jan 27, but your event is Jan 28. Check the date.',
    );
    expect(issue(session('Early', '2030-01-28T08:00:00.000Z', '2030-01-28T08:30:00.000Z'))).toBe(
      '"Early" starts at 8:00 AM, but your event starts at 9:00 AM. Check the time.',
    );
  });

  it('names a session that ends late or ends before it starts', () => {
    expect(issue(session('Late', '2030-01-28T17:30:00.000Z', '2030-01-28T19:00:00.000Z'))).toBe(
      '"Late" ends at 7:00 PM, but your event ends at 6:00 PM. Check the time.',
    );
    expect(issue(session('Backwards', '2030-01-28T12:00:00.000Z', '2030-01-28T11:00:00.000Z'))).toBe(
      '"Backwards" has invalid times: starts at 12:00 PM but ends at 11:00 AM. The end time must be after the start time.',
    );
  });
});

describe('links and social handles', () => {
  it.each([
    ['twitter', '@plabs', 'https://x.com/plabs'],
    ['discord', 'plabs', 'https://discord.com/users/plabs'],
    ['discord', 'discord.gg/abc', 'https://discord.gg/abc'],
    ['bluesky', 'plabs.bsky.social', 'https://bsky.app/profile/plabs.bsky.social'],
    ['mastodon', '@pl@fosstodon.org', 'https://fosstodon.org/@pl'],
    ['mastodon', 'pl', 'https://mastodon.social/@pl'],
    ['telegram', '@plabs', 'https://t.me/plabs'],
    ['email', 'events@pl.xyz', 'events@pl.xyz'],
    ['twitter', 'https://x.com/already', 'https://x.com/already'],
  ])('turns a %s handle %s into %s', (platform, handle, address) => {
    expect(normalizeSocialHandle(platform, handle)).toBe(address);
  });

  it('reads stored addresses back as rows', () => {
    expect(fromContactInfos({ twitter: ['https://x.com/pl'], email: ['a@b.co', ''] })).toEqual([
      { platform: 'twitter', handle: 'https://x.com/pl' },
      { platform: 'email', handle: 'a@b.co' },
    ]);
    expect(fromContactInfos(null)).toEqual([]);
  });
});

describe('checkEventForm', () => {
  const check = (over: Partial<EventFormValues>, mode: 'submit' | 'draft' = 'submit') =>
    checkEventForm(valid(over), mode);

  it('passes a valid form, also with no venue and no description', () => {
    expect(check({})).toEqual({});
  });

  it('says "Event name required"', () => {
    expect(check({ name: '  ' }).name).toBe('Event name required');
  });

  it('says "Start date and end date is required"', () => {
    expect(check({ endDay: '' }).dates).toBe('Start date and end date is required');
    expect(check({ startDay: '' }).dates).toBe('Start date and end date is required');
  });

  it('says "Time zone is required"', () => {
    expect(check({ timezone: '' }).timezone).toBe('Time zone is required');
  });

  it('says "At least one tag is required"', () => {
    expect(check({ tags: [] }).tags).toBe('At least one tag is required');
  });

  it('says "Enter a valid host name"', () => {
    expect(check({ hostName: '' }).hostName).toBe('Enter a valid host name');
  });

  it('says "Co-host name is required" and "Enter a valid email" on the co-host row', () => {
    const errors = check({
      coHosts: [
        { name: 'Ann', email: 'ann@example.com' },
        { name: '', email: 'not-an-email' },
      ],
    });
    expect(errors.coHosts).toEqual([undefined, { name: 'Co-host name is required', email: 'Enter a valid email' }]);
  });

  it('says "Enter a valid registration link" and "Enter a valid website link"', () => {
    expect(check({ registrationUrl: 'not a link' }).registrationUrl).toBe('Enter a valid registration link');
    expect(check({ websiteUrl: 'not a link' }).websiteUrl).toBe('Enter a valid website link');
    expect(check({ registrationUrl: 'lu.ma/abc', websiteUrl: 'https://example.com/x?y=1' })).toEqual({});
  });

  it('says the description is too long past 10,000 characters of text, tags and &nbsp; not counted extra', () => {
    const at = `<p>${'a'.repeat(9998)}&nbsp;b</p>`;
    expect(check({ description: at }).description).toBeUndefined();
    expect(check({ description: `<p>${'a'.repeat(10001)}</p>` }).description).toBe(
      'Description must be at most 10,000 characters',
    );
    expect(check({ description: `<p>${'a'.repeat(10001)}</p>` }, 'draft').description).toBe(
      'Description must be at most 10,000 characters',
    );
  });

  it('says "Enter a valid meeting link" for an online or hybrid event only', () => {
    expect(check({ format: 'VIRTUAL', meetingUrl: 'not a link' }).meetingUrl).toBe('Enter a valid meeting link');
    expect(check({ format: 'HYBRID', meetingUrl: 'not a link' }).meetingUrl).toBe('Enter a valid meeting link');
    expect(check({ format: 'IN_PERSON', meetingUrl: 'not a link' }).meetingUrl).toBeUndefined();
    expect(check({ format: 'VIRTUAL', meetingUrl: 'meet.google.com/abc-defg-hij' })).toEqual({});
  });

  it('says "Please select a platform" on the row with a handle and no platform', () => {
    const errors = check({
      socialHandles: [
        { platform: 'twitter', handle: '@plabs' },
        { platform: '', handle: 'someone' },
      ],
    });
    expect(errors.socialHandles).toEqual([undefined, 'Please select a platform']);
  });

  it('shows the message on a wrong second handle', () => {
    const errors = check({
      socialHandles: [
        { platform: 'email', handle: 'events@pl.xyz' },
        { platform: 'email', handle: 'not-an-email' },
      ],
    });
    expect(errors.socialHandles).toEqual([undefined, EVENT_FORM_TEXT.handleInvalid]);
  });

  it('says the agenda session is outside the event', () => {
    const agenda = { sessions: [session('Afterparty', '2030-01-29T20:00:00.000Z', '2030-01-29T22:00:00.000Z')] };
    expect(check({ agenda }).agenda).toContain('"Afterparty" is on Jan 29');
    expect(check({ agenda, endDay: '' }).agenda).toBe('Please set your event start date, end date, and timezone first');
  });

  it('lets a draft through with a name, dates and a time zone only', () => {
    expect(check({ tags: [], hostName: '' }, 'draft')).toEqual({});
  });

  it('still checks a draft’s name, dates, social handles and agenda', () => {
    expect(check({ name: '' }, 'draft').name).toBe('Event name required');
    expect(check({ startDay: '' }, 'draft').dates).toBe('Start date and end date is required');
    expect(check({ socialHandles: [{ platform: '', handle: 'x' }] }, 'draft').socialHandles).toEqual([
      'Please select a platform',
    ]);
    const agenda = { sessions: [session('Afterparty', '2030-01-29T20:00:00.000Z', '2030-01-29T22:00:00.000Z')] };
    expect(check({ agenda }, 'draft').agenda).toBeDefined();
  });
});

describe('toEventBody', () => {
  const place = {
    city: 'Lisbon',
    state: 'Lisboa',
    country: 'Portugal',
    latitude: 38.72,
    longitude: -9.14,
    locationUrl: 'https://maps.google.com/?q=x',
  };

  it('maps an in-person event with a resolved venue', () => {
    const body = toEventBody(
      valid({
        venue: 'Avenida da Liberdade 10',
        place,
        instruction: '8th Floor',
        meetingUrl: 'meet.example.com/x',
        registrationUrl: 'lu.ma/abc',
        accessOption: 'PAID',
        tags: ['Workshop', 'Demo Day'],
        hostEmail: 'host@pl.xyz',
        coHosts: [{ name: ' Ann ', email: '' }],
        description: '<h1>Hello</h1>',
      }),
      'img-1',
    );
    expect(body).toMatchObject({
      name: 'Lisbon Meetup',
      description: '<h1>Hello</h1>',
      startDate: '2030-01-28T09:00:00.000Z',
      endDate: '2030-01-28T18:00:00.000Z',
      timezone: 'Europe/Lisbon',
      allDay: false,
      format: 'IN_PERSON',
      accessOption: 'PAID',
      tags: ['Workshop', 'Demo Day'],
      hostName: 'Protocol Labs',
      hostEmail: 'host@pl.xyz',
      coHosts: [{ name: 'Ann', email: null }],
      registrationUrl: 'https://lu.ma/abc',
      meetingUrl: null,
      locationUrl: 'https://maps.google.com/?q=x',
      address: {
        address: 'Avenida da Liberdade 10',
        city: 'Lisbon',
        state: 'Lisboa',
        country: 'Portugal',
        latitude: 38.72,
        longitude: -9.14,
        locationInstructions: '8th Floor',
      },
      logoUid: 'img-1',
    });
  });

  it('sends free text as the address with no city', () => {
    const body = toEventBody(valid({ venue: "My friend's garage" }), null);
    expect(body.address).toEqual({
      address: "My friend's garage",
      city: null,
      state: null,
      country: null,
      latitude: null,
      longitude: null,
      locationInstructions: null,
    });
    expect(body.locationUrl).toBeNull();
  });

  it('sends no address for an online event and no meeting link for an in-person one', () => {
    const online = toEventBody(
      valid({ format: 'VIRTUAL', venue: 'Somewhere', place, meetingUrl: 'https://meet.x/y' }),
      null,
    );
    expect(online.address).toBeNull();
    expect(online.locationUrl).toBeNull();
    expect(online.meetingUrl).toBe('https://meet.x/y');
    const hybrid = toEventBody(
      valid({ format: 'HYBRID', venue: 'Somewhere', place, meetingUrl: 'https://meet.x/y' }),
      null,
    );
    expect(hybrid.address?.city).toBe('Lisbon');
    expect(hybrid.meetingUrl).toBe('https://meet.x/y');
  });

  it("sends the description with plain spaces, so the editor's &nbsp; does not stop lines from wrapping", () => {
    const body = toEventBody(valid({ description: '<p>Lorem&nbsp;ipsum&#160;dolor\u00a0sit</p>' }), null);
    expect(body.description).toBe('<p>Lorem ipsum dolor sit</p>');
  });

  it('sends a description with no text as empty, and no agenda as null', () => {
    const body = toEventBody(valid({ description: '<p><br></p>', agenda: { sessions: [] } }), null);
    expect(body.description).toBe('');
    expect(body.agenda).toBeNull();
    expect(body.logoUid).toBeNull();
  });

  it('turns social handles into addresses by platform', () => {
    const body = toEventBody(
      valid({
        socialHandles: [
          { platform: 'twitter', handle: '@plabs' },
          { platform: 'twitter', handle: 'https://x.com/ipfs' },
          { platform: 'email', handle: '' },
        ],
      }),
      null,
    );
    expect(body.contactInfos).toEqual({ twitter: ['https://x.com/plabs', 'https://x.com/ipfs'] });
  });
});
