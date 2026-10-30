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

describe('selectForYouItems with news tags (LAB-3001)', () => {
  const own = makeItem('own', 'team-own');
  const tagged = makeItem('tagged', 'team-x', { tags: ['ai'] });
  const related = makeItem('related', 'team-related', { tags: ['launch'] });

  it("keeps own and followed teams' stories plus any team's story sharing a tag", () => {
    expect(selectForYouItems([own, tagged, related], new Set(['team-own']), new Set(['ai'])).map((i) => i.uid)).toEqual(
      ['own', 'tagged'],
    );
  });

  it('matches tags case- and space-insensitively, as the backend does', () => {
    const messy = makeItem('messy', 'team-y', { tags: [' AI '] });
    expect(selectForYouItems([messy], new Set(), new Set(['ai'])).map((i) => i.uid)).toEqual(['messy']);
  });

  it('matches by tag alone when the member has no teams', () => {
    expect(selectForYouItems([own, tagged], new Set(), new Set(['ai'])).map((i) => i.uid)).toEqual(['tagged']);
  });

  it('keeps one story per team, the newest, across team and tag matches', () => {
    const newer = makeItem('newer', 'team-x', { tags: ['ai'], eventDate: '2026-05-03T12:00:00.000Z' });
    const older = makeItem('older', 'team-x', { tags: ['ai'], eventDate: '2026-05-02T12:00:00.000Z' });
    expect(selectForYouItems([older, newer], new Set(), new Set(['ai'])).map((i) => i.uid)).toEqual(['newer']);
  });

  it('with an empty tag set keeps only own and followed teams', () => {
    expect(selectForYouItems([own, tagged], new Set(['team-own']), new Set()).map((i) => i.uid)).toEqual(['own']);
  });

  it('returns nothing with no teams and no tags', () => {
    expect(selectForYouItems([own, tagged], new Set(), new Set())).toEqual([]);
  });
});
