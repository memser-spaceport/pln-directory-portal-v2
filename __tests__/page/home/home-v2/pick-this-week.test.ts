import { pickThisWeek } from '@/components/page/home/HomeV2/utils/pickThisWeek';
import type { ITeamNewsItem } from '@/types/team-news.types';

const makeStory = (uid: string, overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid,
  teamUid: `team-${uid}`,
  teamName: `Team ${uid}`,
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT',
  eventDate: '2026-11-01T12:00:00.000Z',
  title: `Headline ${uid}`,
  summary: null,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-11-01T12:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  ...overrides,
});

const day = (d: number) => `2026-11-0${d}T12:00:00.000Z`;

describe('pickThisWeek', () => {
  it('leads with the ranked stories in rank order, then tops up with the newest', () => {
    const items = [
      makeStory('old-ranked-2', { eventDate: day(1), editorialRank: 2 }),
      makeStory('newest', { eventDate: day(5) }),
      makeStory('ranked-1', { eventDate: day(2), editorialRank: 1 }),
      makeStory('newer', { eventDate: day(4) }),
    ];

    expect(pickThisWeek(items).map((i) => i.uid)).toEqual(['ranked-1', 'old-ranked-2', 'newest']);
  });

  it('shows the three newest when nothing is ranked', () => {
    const items = [1, 2, 3, 4, 5].map((d) => makeStory(`s${d}`, { eventDate: day(d) }));

    expect(pickThisWeek(items).map((i) => i.uid)).toEqual(['s5', 's4', 's3']);
  });

  it('returns what there is when fewer than three stories exist', () => {
    expect(pickThisWeek([makeStory('only')]).map((i) => i.uid)).toEqual(['only']);
    expect(pickThisWeek([])).toEqual([]);
  });

  it('takes ranks 1 to 3 only, and never a story twice', () => {
    const items = [
      makeStory('rank-4', { eventDate: day(1), editorialRank: 4 }),
      makeStory('rank-3', { eventDate: day(2), editorialRank: 3 }),
      makeStory('rank-3', { eventDate: day(2), editorialRank: 3 }),
      makeStory('newest', { eventDate: day(6) }),
    ];

    expect(pickThisWeek(items).map((i) => i.uid)).toEqual(['rank-3', 'newest', 'rank-4']);
  });

  it('leaves out hiring roll-ups, deals and forum posts', () => {
    const items = [
      makeStory('hiring', { eventType: 'HIRING', eventDate: day(9) }),
      makeStory('deal', { eventType: 'DEALS', eventDate: day(8) }),
      makeStory('fp_123', { eventDate: day(7) }),
      makeStory('news', { eventDate: day(1) }),
    ];

    expect(pickThisWeek(items).map((i) => i.uid)).toEqual(['news']);
  });
});
