import {
  formatEventDateLine,
  tagColorIndex,
  toAgendaDays,
  toEventAccess,
  toEventAttendee,
  toEventDetail,
  toEventMode,
  toEventTag,
  toMyGatheringPlans,
} from '@/services/events/event-drawer.mappers';
import { bareEventResponse, eventResponse } from '@/components/page/events/EventDrawer/EventDrawer.fixtures';

describe('event drawer mappers (LAB-3216)', () => {
  describe('tag colours, as the PL events app derives them', () => {
    it('uses the fixed pairs for the default tags, case-insensitively', () => {
      expect(toEventTag('Workshop')).toEqual({ name: 'Workshop', icon: '#FF1493', background: '#FFD9EB' });
      expect(toEventTag('pl event')).toEqual({ name: 'pl event', icon: '#FFB800', background: '#FEF3C7' });
    });

    it('hashes any other tag to a pair 1..15', () => {
      for (const name of ['AI', 'Conference', 'Talks & Presentation', '', 'x'.repeat(200)]) {
        const index = tagColorIndex(name);
        expect(index).toBeGreaterThanOrEqual(1);
        expect(index).toBeLessThanOrEqual(15);
      }
      // (hash << 5) - hash + charCode: "AI" = 65*31 + 73 = 2088; 2088 % 15 = 3; + 1 = 4
      expect(tagColorIndex('AI')).toBe(4);
      expect(toEventTag('AI')).toEqual({ name: 'AI', icon: '#00897B', background: '#00897B1F' });
    });
  });

  describe('mode and access', () => {
    it.each([
      ['IN-PERSON', 'In-Person'],
      ['IN_PERSON', 'In-Person'],
      ['in person', 'In-Person'],
      ['VIRTUAL', 'Virtual'],
      ['Hybrid', 'Hybrid'],
    ])('reads format %s as %s', (format, mode) => {
      expect(toEventMode(format)).toBe(mode);
    });

    it('falls back to the event type, and hides an unknown mode', () => {
      expect(toEventMode(null, 'VIRTUAL')).toBe('Virtual');
      expect(toEventMode('SOMETHING', 'INVITE_ONLY')).toBeNull();
    });

    it.each([
      ['PAID', 'PAID'],
      ['OPEN', 'FREE w/ RSVP'],
      ['Free w/ RSVP', 'FREE w/ RSVP'],
      ['FREE_WITH_RSVP', 'FREE w/ RSVP'],
      ['INVITE ONLY', 'INVITE ONLY'],
      ['invite_only', 'INVITE ONLY'],
    ])('reads access %s as %s', (option, access) => {
      expect(toEventAccess(option)).toBe(access);
    });

    it('hides an unknown access, unless the event itself is invite-only', () => {
      expect(toEventAccess('???')).toBeNull();
      expect(toEventAccess(null, null, 'INVITE_ONLY')).toBe('INVITE ONLY');
    });
  });

  describe('dates', () => {
    it('prints the date line in the gathering timezone with its UTC offset', () => {
      expect(formatEventDateLine('2026-11-19T23:00:00.000Z', '2026-11-20T02:00:00.000Z', 'America/New_York')).toBe(
        '19th Nov 2026, 18:00 - 19th Nov 2026, 21:00 (UTC -5:00)',
      );
      expect(formatEventDateLine('2030-12-01T09:00:00.000Z', '2030-12-05T18:00:00.000Z', 'Europe/Lisbon')).toBe(
        '1st Dec 2030, 09:00 - 5th Dec 2030, 18:00 (UTC +0:00)',
      );
    });

    it('falls back to UTC for an unknown timezone', () => {
      expect(formatEventDateLine('2030-12-01T09:00:00.000Z', '2030-12-01T10:00:00.000Z', 'Mars/Base')).toContain(
        '(UTC +0:00)',
      );
    });

    it('groups agenda sessions by day and skips unreadable ones', () => {
      const days = toAgendaDays(
        {
          sessions: [
            { name: 'Late', start_date: '2030-12-02T10:00:00.000Z', end_date: '2030-12-02T11:00:00.000Z' },
            {
              name: 'Early',
              startDate: '2030-12-01T09:00:00.000Z',
              endDate: '2030-12-01T10:00:00.000Z',
              description: 'Coffee',
            },
            { name: '', start_date: '2030-12-01T09:00:00.000Z' },
            { name: 'No date' },
            'nonsense',
          ],
        },
        'UTC',
      );
      expect(days).toEqual([
        { day: 'Day 1 - 1st Dec Sun', items: [{ time: '9:00 AM - 10:00 AM', title: 'Early', about: 'Coffee' }] },
        { day: 'Day 2 - 2nd Dec Mon', items: [{ time: '10:00 AM - 11:00 AM', title: 'Late' }] },
      ]);
      expect(toAgendaDays(null, 'UTC')).toEqual([]);
    });
  });

  describe('toEventDetail', () => {
    it('maps a full event', () => {
      const event = toEventDetail(eventResponse());
      expect(event.mode).toBe('In-Person');
      expect(event.access).toBe('FREE w/ RSVP');
      expect(event.tags.map((t) => t.name)).toEqual(['Conference', 'AI']);
      expect(event.hosts).toEqual(['Protocol Labs']);
      expect(event.agenda).toHaveLength(2);
      expect(event.address).toBe('Lisbon, Portugal');
      expect(event.gathering?.city).toBe('Lisbon');
      expect(event.gathering?.resources.map((r) => r.name)).toEqual(['Telegram', 'Shared notes']);
      expect(event.gathering?.events).toHaveLength(3);
      expect(event.viewer).toBeNull();
    });

    it('leaves empty tags, agenda and hosts empty', () => {
      const event = toEventDetail(bareEventResponse());
      expect(event.tags).toEqual([]);
      expect(event.agenda).toEqual([]);
      expect(event.hosts).toEqual([]);
      expect(event.description).toBeNull();
      expect(event.mode).toBe('In-Person'); // from PLEvent.type
      expect(event.access).toBeNull();
    });

    it('survives an event with no details and no location', () => {
      const event = toEventDetail(eventResponse({ details: null, location: null }));
      expect(event.gathering).toBeNull();
      expect(event.address).toBeNull();
      expect(event.timezone).toBe('UTC');
    });

    it("uses the event's logo as its picture, then its banner", () => {
      expect(
        toEventDetail(eventResponse({ logo: 'https://cdn.test/logo.png', banner: 'https://cdn.test/banner.png' }))
          .image,
      ).toBe('https://cdn.test/logo.png');
      expect(toEventDetail(eventResponse({ logo: null, banner: 'https://cdn.test/banner.png' })).image).toBe(
        'https://cdn.test/banner.png',
      );
      expect(toEventDetail(eventResponse({ logo: null, banner: null })).image).toBeNull();
    });

    it('falls back to the member hosts when the sync sent none', () => {
      const event = toEventDetail(bareEventResponse({ hosts: [{ uid: 'm-9', name: 'Iris Host', image: null }] }));
      expect(event.hosts).toEqual(['Iris Host']);
    });

    it('keeps the viewer only when they are going', () => {
      expect(
        toEventDetail(eventResponse({ viewerGoing: true, viewer: { showOnProfile: false, roles: [] } })).viewer,
      ).toEqual({
        showOnProfile: false,
        roles: [],
      });
      expect(toEventDetail(eventResponse({ viewerGoing: false, viewer: null })).viewer).toBeNull();
    });
  });

  it('maps a guests-list row with its team role and event roles', () => {
    const row = {
      memberUid: 'm-1',
      member: {
        name: 'Ana',
        image: { url: 'https://img/ana.png' },
        teamMemberRoles: [{ role: 'CEO', team: { uid: 't-1', name: 'Lighthouse' } }],
      },
      team: { uid: 't-1', name: 'Lighthouse', logo: null },
      events: [
        { uid: 'other', isHost: true },
        { uid: 'ev-1', isHost: false, isSpeaker: true, isSponsor: true },
      ],
      count: 12,
    };
    expect(toEventAttendee(row, 'ev-1')).toEqual({
      memberUid: 'm-1',
      name: 'Ana',
      image: 'https://img/ana.png',
      role: 'CEO',
      teamName: 'Lighthouse',
      roles: ['Speaker', 'Sponsor'],
    });
  });

  it('folds the caller rows at a gathering into plans', () => {
    const plans = toMyGatheringPlans([
      {
        event: { uid: 'a' },
        isSpeaker: true,
        topics: ['AI'],
        reason: 'hi',
        teamUid: 't-1',
        additionalInfo: { checkInDate: '2030-12-01', checkOutDate: '2030-12-03' },
        telegramId: '@me',
        officeHours: 'https://cal',
      },
      { event: { uid: 'b' } },
      { event: null },
    ]);
    expect(plans).toEqual({
      eventUids: ['a', 'b'],
      eventRoles: [
        { eventUid: 'a', roles: ['Speaker'] },
        { eventUid: 'b', roles: ['Attendee'] },
      ],
      topics: ['AI'],
      reason: 'hi',
      teamUid: 't-1',
      checkInDate: '2030-12-01',
      checkOutDate: '2030-12-03',
      telegramId: '@me',
      officeHours: 'https://cal',
    });
    expect(toMyGatheringPlans([]).eventUids).toEqual([]);
    expect(toMyGatheringPlans(undefined).eventUids).toEqual([]);
  });
});
