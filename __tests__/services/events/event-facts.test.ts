import { ACCESS_COPY, eventPlace } from '@/services/events/event-facts';

/* LAB-3247: one wording for an event's place and access across the cards, the Calendar and the drawer. */

it('reads the place with the mode folded in', () => {
  expect(eventPlace('Virtual', 'Lisbon')).toEqual({ text: 'Online', online: true });
  expect(eventPlace('Hybrid', 'Lisbon')).toEqual({ text: 'Lisbon · also online', online: false });
  expect(eventPlace('Hybrid', null)).toEqual({ text: 'Online', online: true });
  expect(eventPlace('In-Person', 'Lisbon')).toEqual({ text: 'Lisbon', online: false });
  expect(eventPlace(null, null)).toBeNull();
});

it('words every access type', () => {
  expect(ACCESS_COPY.PAID).toEqual({ main: 'Paid', sub: "Tickets on the host's site" });
  expect(ACCESS_COPY['INVITE ONLY'].main).toBe('Invite only');
  // LAB-3407: the events service's OPEN says nothing about the price.
  expect(ACCESS_COPY['FREE w/ RSVP']).toEqual({ main: 'RSVP to save your spot', sub: null });
});
