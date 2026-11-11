import type { EventDetail } from '../member-events-going/mocks';

import type { CalEvent } from './mocks';

const at = (iso: string) => new Date(`${iso}T12:00:00`);

export const monthShort = (iso: string) => at(iso).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
export const dayOfMonth = (iso: string) => at(iso).getDate();

/** "Thursday, November 19" or "Tue, Dec 1 – Sat, Dec 5". */
export function dayLine(event: CalEvent) {
  if (event.startDate === event.endDate) {
    return at(event.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  const short = (iso: string) =>
    at(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${short(event.startDate)} – ${short(event.endDate)}`;
}

const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
};

/**
 * "6:00 PM – 9:00 PM · UTC−5", read from the events app's one-line date
 * ("19th Nov 2026, 18:00 - 19th Nov 2026, 21:00 (UTC -5:00)").
 */
export function timeLine(detail: EventDetail) {
  const times = detail.dateLine.match(/\d{2}:\d{2}/g) ?? [];
  const tz = detail.dateLine.match(/\(UTC\s*([+-])(\d+):(\d{2})\)/);
  const [, sign, hours, minutes] = tz ?? [];
  const zone = tz ? `UTC${sign === '-' ? '−' : '+'}${Number(hours)}${minutes === '00' ? '' : `:${minutes}`}` : '';
  const [from, to] = times;
  const span = from && to ? `${to12h(from)} – ${to12h(to)}` : '';
  return [span, zone].filter(Boolean).join(' · ');
}

/** The first time of day, for the calendar's bars ("6:00 PM"). */
export const startTime = (detail: EventDetail) => {
  const t = detail.dateLine.match(/\d{2}:\d{2}/);
  return t ? to12h(t[0]) : '';
};

/** "Betaworks" and "29 Little W 12th St, New York…" from the app's one-line address. */
export function venueOf(detail: EventDetail) {
  const [venue, ...rest] = detail.address.split(',');
  return { venue: venue.trim(), street: rest.join(',').trim() };
}

/** "New York, New York, United States" → "New York, United States". */
export const regionLine = (detail: EventDetail) =>
  detail.region
    .split(',')
    .map((p) => p.trim())
    .filter((p, i, all) => p !== all[i - 1])
    .join(', ');

export const MODE_LABEL: Record<EventDetail['mode'], string> = {
  'In-Person': 'In person',
  Virtual: 'Online',
  Hybrid: 'Hybrid',
};

export const ACCESS_LABEL: Record<EventDetail['access'], string> = {
  PAID: 'Paid',
  'FREE w/ RSVP': 'Free with RSVP',
  'INVITE ONLY': 'Invite only',
};

export const mapsHref = (detail: EventDetail) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.address)}`;
