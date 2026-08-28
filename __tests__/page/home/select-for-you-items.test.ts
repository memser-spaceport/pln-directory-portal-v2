import { selectForYouItems } from '@/components/page/home/TeamNews/utils/selectForYouItems';
import type { ITeamNewsItem } from '@/types/team-news.types';

const makeItem = (uid: string, teamUid: string, overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid,
  teamUid,
  teamName: teamUid,
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT',
  eventDate: '2026-05-01T12:00:00.000Z',
  title: `Headline ${uid}`,
  summary: null,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-05-01T12:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  ...overrides,
});

describe('selectForYouItems', () => {
  it('returns nothing when the team set is empty', () => {
    expect(selectForYouItems([makeItem('a', 'team-a')], new Set())).toEqual([]);
  });

  it('drops teams that are not in the set', () => {
    const kept = makeItem('keep', 'team-keep');
    const dropped = makeItem('drop', 'team-drop');

    expect(selectForYouItems([kept, dropped], new Set(['team-keep'])).map((i) => i.uid)).toEqual(['keep']);
  });

  it('keeps the latest item per team by eventDate then createdAt', () => {
    const olderDay = makeItem('old-day', 'team-a', { eventDate: '2026-04-01T12:00:00.000Z' });
    const sameDayEarlier = makeItem('same-early', 'team-a', { createdAt: '2026-05-01T10:00:00.000Z' });
    const sameDayLater = makeItem('same-late', 'team-a', { createdAt: '2026-05-01T18:00:00.000Z' });
    const otherTeam = makeItem('other', 'team-b');

    const selected = selectForYouItems(
      [olderDay, sameDayEarlier, otherTeam, sameDayLater],
      new Set(['team-a', 'team-b']),
    );

    expect(selected.map((i) => i.uid)).toEqual(['same-late', 'other']);
  });
});
