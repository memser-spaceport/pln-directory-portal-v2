import {
  eventCalendarHref,
  eventCalendarSlug,
  eventDay,
  eventMonth,
  eventRange,
  selectUpcomingEvents,
} from '@/components/page/home/HomeV2/utils/upcomingEvents';
import type { IHomeEvent } from '@/types/home.types';

const NOW = Date.parse('2026-11-04T12:00:00.000Z');
const inDays = (d: number) => new Date(NOW + d * 24 * 60 * 60 * 1000).toISOString();
const ev = (uid: string, startDays: number): IHomeEvent => ({
  uid,
  name: `Event ${uid}`,
  startDate: inDays(startDays),
  endDate: inDays(startDays),
  location: 'Lisbon',
});

describe('selectUpcomingEvents', () => {
  it('keeps events starting in the next 30 days, soonest first', () => {
    const events = [ev('in45', 45), ev('in20', 20), ev('in3', 3)];

    expect(selectUpcomingEvents(events, NOW).map((e) => e.uid)).toEqual(['in3', 'in20']);
  });

  it('shows at most three', () => {
    const events = [ev('a', 5), ev('b', 4), ev('c', 3), ev('d', 2), ev('e', 1)];

    expect(selectUpcomingEvents(events, NOW).map((e) => e.uid)).toEqual(['e', 'd', 'c']);
  });

  it('keeps an event already under way', () => {
    expect(selectUpcomingEvents([ev('ongoing', -1)], NOW).map((e) => e.uid)).toEqual(['ongoing']);
  });

  it('returns nothing when no event starts in the window', () => {
    expect(selectUpcomingEvents([ev('later', 31)], NOW)).toEqual([]);
  });
});

describe('the event date labels', () => {
  it('reads the date tile in UTC', () => {
    expect(eventMonth('2026-11-03T09:00:00.000Z')).toBe('NOV');
    expect(eventDay('2026-11-03T09:00:00.000Z')).toBe(3);
  });

  it('draws a range only for a multi-day event', () => {
    expect(eventRange('2026-11-03T09:00:00.000Z', '2026-11-07T18:00:00.000Z')).toBe('Nov 3–7');
    expect(eventRange('2026-11-30T09:00:00.000Z', '2026-12-02T18:00:00.000Z')).toBe('Nov 30–Dec 2');
    expect(eventRange('2026-11-03T09:00:00.000Z', '2026-11-03T18:00:00.000Z')).toBeNull();
    expect(eventRange('2026-11-03T09:00:00.000Z', 'not a date')).toBeNull();
  });
});

// Names and slugs from the dev calendar (pln-events), 2026-11-06; each slug opened its event at /embed/program#<slug>.
// The last two cases follow pln-events' stringToSlug (utils/helper.ts), which this ports.
describe('eventCalendarSlug', () => {
  it.each([
    ['Singapore Tech Event', 'singapore-tech-event'],
    ['Nucleate RI | PATH:Inside Venture Creation', 'nucleate-ri-path-inside-venture-creation'],
    ['Offline Reading Party 📚 | Café De With', 'offline-reading-party-cafe-de-with'],
    ["CCSB's February Climate Cafe", 'ccsbs-february-climate-cafe'],
    [
      'AI Meets Robotics – Launch & Fund Your Own Startup (Edition 1)',
      'ai-meets-robotics-launch-fund-your-own-startup-edition-1',
    ],
    [
      'Build a Photo-to-Video AI App (Google Veo × Antigravity × Vercel)',
      'build-a-photo-to-video-ai-app-google-veo-antigravity-vercel',
    ],
    [
      '🧠 Collective Intelligence ~ Live From San Francisco 🎙️ (w/ The AI Collective)',
      '-collective-intelligence-live-from-san-francisco-w-the-ai-collective',
    ],
    ['AdoptionCon | ETHDenver 🇺🇸', 'adoptioncon-ethdenver-'],
    // pln-events' stringToSlug turns these into `-` rather than dropping them, and trims the name first.
    ['Founders/Builders_Night, Day; Two · Three', 'founders-builders-night-day-two-three'],
    ['  Padded Name  ', 'padded-name'],
  ])('%s → %s, as pln-events makes it', (name, slug) => {
    expect(eventCalendarSlug(name)).toBe(slug);
  });
});

describe('eventCalendarHref', () => {
  it('opens All Events with the event open, the link the calendar writes itself', () => {
    expect(eventCalendarHref('Singapore Tech Event')).toBe(
      '/events/all?embedPath=%2Fembed%2Fprogram%23singapore-tech-event',
    );
  });

  it('keeps the edge dashes pln-events keeps', () => {
    expect(eventCalendarHref('AdoptionCon | ETHDenver 🇺🇸')).toBe(
      '/events/all?embedPath=%2Fembed%2Fprogram%23adoptioncon-ethdenver-',
    );
  });

  it('is the plain calendar when the name leaves no slug', () => {
    expect(eventCalendarHref('🎉 🎉')).toBe('/events/all');
    expect(eventCalendarHref('')).toBe('/events/all');
  });
});
