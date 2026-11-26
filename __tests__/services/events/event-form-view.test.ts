import { eventResponse } from '@/components/page/events/EventDrawer/EventDrawer.fixtures';
import { defaultEventFormValues } from '@/services/events/event-form';
import { toEditableEvent, toPreviewEvent, type EventEditResponse } from '@/services/events/event-form-view';

/* The form filled from a stored event (edit page), and the event drawn from form values (Preview, read-only view). */

const stored = (over: Partial<EventEditResponse> = {}): EventEditResponse => ({
  ...eventResponse({
    uid: 'e1',
    name: 'Lisbon Meetup',
    startDate: '2030-01-28T09:00:00.000Z',
    endDate: '2030-01-29T18:00:00.000Z',
    logo: 'https://img/logo.png',
    websiteUrl: 'https://example.com',
  }),
  ...over,
});

describe('toEditableEvent', () => {
  it('fills the form from the event’s own fields, with clock times in its time zone', () => {
    const event = toEditableEvent(
      stored({
        status: 'DRAFT',
        timezone: 'Asia/Tokyo',
        logoUid: 'img-1',
        format: 'HYBRID',
        accessOption: 'INVITE',
        tags: ['Workshop', 'Workshop', 'Demo Day'],
        hostName: 'Protocol Labs',
        hostEmail: 'host@pl.xyz',
        coHosts: [{ name: 'Ann', email: 'ann@pl.xyz' }, { name: 'Bo' }],
        registrationUrl: 'https://lu.ma/abc',
        meetingUrl: 'https://meet.x/y',
        contactInfos: { twitter: ['https://x.com/pl'] },
        agenda: {
          sessions: [{ name: 'Opening', start_date: '2030-01-28T10:00:00.000Z', end_date: '2030-01-28T10:30:00.000Z' }],
          agendaSummary: '10:00 Opening',
        },
        address: {
          address: 'Shibuya 1-1',
          city: 'Tokyo',
          country: 'Japan',
          latitude: 35.6,
          longitude: 139.7,
          locationUrl: 'https://maps.test/x',
          locationInstructions: '8th Floor',
        },
        updatedAt: '2030-01-01T00:00:00.000Z',
      }),
    );
    expect(event).toMatchObject({ uid: 'e1', status: 'DRAFT', logoUrl: 'https://img/logo.png' });
    expect(event.values).toMatchObject({
      name: 'Lisbon Meetup',
      timezone: 'Asia/Tokyo',
      startDay: '2030-01-28',
      startTime: '18:00',
      endDay: '2030-01-30',
      endTime: '03:00',
      format: 'HYBRID',
      accessOption: 'INVITE',
      tags: ['Workshop', 'Demo Day'],
      hostName: 'Protocol Labs',
      hostEmail: 'host@pl.xyz',
      coHosts: [
        { name: 'Ann', email: 'ann@pl.xyz' },
        { name: 'Bo', email: '' },
      ],
      registrationUrl: 'https://lu.ma/abc',
      meetingUrl: 'https://meet.x/y',
      websiteUrl: 'https://example.com',
      socialHandles: [{ platform: 'twitter', handle: 'https://x.com/pl' }],
      venue: 'Shibuya 1-1',
      place: { city: 'Tokyo', country: 'Japan', latitude: 35.6, longitude: 139.7, locationUrl: 'https://maps.test/x' },
      instruction: '8th Floor',
      logo: { kind: 'stored', uid: 'img-1', url: 'https://img/logo.png' },
    });
    expect(event.values.agenda).toEqual({
      sessions: [{ name: 'Opening', start_date: '2030-01-28T10:00:00.000Z', end_date: '2030-01-28T10:30:00.000Z' }],
      agendaSummary: '10:00 Opening',
    });
  });

  it('falls back to the event details and reads an event with no status as approved', () => {
    const raw = stored();
    const event = toEditableEvent(raw);
    expect(event.status).toBe('APPROVED');
    expect(event.values.hostName).toBe(raw.details?.host?.name ?? '');
    expect(event.values.tags).toEqual((raw.details?.tags ?? []).map((tag) => tag.name));
    expect(event.values.timezone).toBe(raw.location?.timezone);
    expect(event.values.venue).toBe('');
    expect(event.values.place).toBeNull();
  });

  it('keeps free text as the venue with no resolved place, and no logo as none', () => {
    const event = toEditableEvent(stored({ logo: null, address: { address: "My friend's garage" } }));
    expect(event.values.venue).toBe("My friend's garage");
    expect(event.values.place).toBeNull();
    expect(event.values.logo).toBeNull();
  });
});

describe('toPreviewEvent', () => {
  const values = {
    ...defaultEventFormValues('Europe/Lisbon'),
    name: 'Lisbon Meetup',
    startDay: '2030-01-28',
    startTime: '09:00',
    endDay: '2030-01-28',
    endTime: '18:00',
  };

  it('draws a half-filled form: name and dates, nothing invented', () => {
    expect(toPreviewEvent(values)).toMatchObject({
      name: 'Lisbon Meetup',
      dateLine: '28th Jan 2030, 09:00 - 28th Jan 2030, 18:00 (UTC +0:00)',
      mode: 'In-Person',
      access: 'FREE w/ RSVP',
      address: null,
      image: null,
      hosts: [],
      description: null,
      agenda: [],
      eventUrl: null,
      status: null,
    });
  });

  it('draws the venue, hosts, links, logo and description of a filled form', () => {
    const event = toPreviewEvent({
      ...values,
      format: 'HYBRID',
      venue: 'Avenida da Liberdade 10',
      place: {
        city: 'Lisbon',
        state: null,
        country: 'Portugal',
        latitude: 1,
        longitude: 2,
        locationUrl: 'https://maps.test/x',
      },
      hostName: 'Protocol Labs',
      coHosts: [{ name: 'Ann', email: '' }],
      registrationUrl: 'lu.ma/abc',
      description: '<h1>Hello</h1>',
      logo: { kind: 'stored', uid: 'img-1', url: 'https://img/logo.png' },
    });
    expect(event).toMatchObject({
      mode: 'Hybrid',
      address: 'Avenida da Liberdade 10',
      locationUrl: 'https://maps.test/x',
      hosts: ['Protocol Labs', 'Ann'],
      eventUrl: 'https://lu.ma/abc',
      description: '<h1>Hello</h1>',
      image: 'https://img/logo.png',
    });
  });

  it('leaves out the dates and an empty description, and names an untitled event', () => {
    const event = toPreviewEvent({ ...values, name: '', startDay: '', description: '<p><br></p>' });
    expect(event).toMatchObject({ name: 'Untitled event', dateLine: '', description: null });
  });
});
