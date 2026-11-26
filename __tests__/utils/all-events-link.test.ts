import { allEventsLink, gatheringScheduleLink, isAllEventsPageOn } from '@/utils/all-events-link';
import { readFilters } from '@/services/events/all-events.filters';

const flags = { page: true, drawer: true };

jest.mock('@/utils/events-page', () => ({
  get SHOW_EVENTS_PAGE_V2() {
    return flags.page;
  },
}));
jest.mock('@/utils/event-drawer', () => ({
  get SHOW_EVENT_DRAWER() {
    return flags.drawer;
  },
}));

const LEGACY = 'https://events.example/calendar?location=London';

/** The city filter the All Events page reads from a link, the way the page itself parses its URL. */
function cityOnPage(href: string): string[] {
  return readFilters(new URLSearchParams(href.split('?')[1] ?? '')).city;
}

describe('IRL gathering links to the All Events page (LAB-3337)', () => {
  beforeEach(() => {
    flags.page = true;
    flags.drawer = true;
  });

  describe('with the All Events page on', () => {
    it('R1/R5: a schedule link opens the page scoped to the city the page shows, in the same tab', () => {
      const link = gatheringScheduleLink('london', LEGACY);
      expect(link).toEqual({ href: '/events/all?city=London', newTab: false });
      expect(cityOnPage(link.href)).toEqual(['London']);
    });

    it('R5: keeps a mixed-case name as the page shows it, and drops the part after a comma', () => {
      expect(cityOnPage(gatheringScheduleLink('CDMX', LEGACY).href)).toEqual(['CDMX']);
      expect(cityOnPage(gatheringScheduleLink('Lisbon, Portugal', LEGACY).href)).toEqual(['Lisbon']);
      expect(cityOnPage(gatheringScheduleLink('san francisco', LEGACY).href)).toEqual(['San Francisco']);
    });

    it('R5: a gathering with no city ("Others", empty) links to the whole page', () => {
      expect(gatheringScheduleLink('Others', LEGACY)).toEqual({ href: '/events/all', newTab: false });
      expect(gatheringScheduleLink(undefined, LEGACY)).toEqual({ href: '/events/all', newTab: false });
    });

    it('R2: a gathering with its own schedule keeps it, in a new tab', () => {
      expect(gatheringScheduleLink('Buenos Aires', LEGACY, 'https://25.labweek.io/25-w3/schedule')).toEqual({
        href: 'https://25.labweek.io/25-w3/schedule',
        newTab: true,
      });
      // A blank one counts as none.
      expect(gatheringScheduleLink('london', LEGACY, '  ').href).toBe('/events/all?city=London');
    });

    it('R4: "View All Events" opens the page in the same tab', () => {
      expect(allEventsLink('https://events.example')).toEqual({ href: '/events/all', newTab: false });
    });
  });

  describe.each([
    ['the page flag off', { page: false, drawer: true }],
    ['the drawer flag off', { page: true, drawer: false }],
  ])('R6: with %s', (_, value) => {
    beforeEach(() => Object.assign(flags, value));

    it('every link stays on the events app, in a new tab', () => {
      expect(isAllEventsPageOn()).toBe(false);
      expect(gatheringScheduleLink('london', LEGACY)).toEqual({ href: LEGACY, newTab: true });
      expect(gatheringScheduleLink('Others', LEGACY)).toEqual({ href: LEGACY, newTab: true });
      expect(allEventsLink('https://events.example')).toEqual({ href: 'https://events.example', newTab: true });
    });

    it("a gathering's own schedule still wins", () => {
      expect(gatheringScheduleLink('Buenos Aires', LEGACY, 'https://25.labweek.io/x').href).toBe(
        'https://25.labweek.io/x',
      );
    });
  });
});
