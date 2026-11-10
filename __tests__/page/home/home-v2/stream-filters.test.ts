import {
  matchesStreamNewsCategory,
  matchesTeamNewsCategory,
} from '@/components/page/home/TeamNews/utils/matchesTeamNewsCategory';
import { matchesTeamNewsQuery } from '@/components/page/home/TeamNews/utils/matchesTeamNewsQuery';
import { ALL_CAT, DISCUSSIONS_CAT, TOP_CAT } from '@/components/page/home/TeamNews/constants';
import { chipVocabulary, selectNarrowByTags } from '@/components/page/home/HomeV2/utils/narrowByTags';
import { computeStreamCut } from '@/components/page/home/HomeV2/utils/streamCut';
import { newsItemHasAllTags } from '@/utils/news-tag-chips';
import type { ITeamNewsItem } from '@/types/team-news.types';

const item = (overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid: 'n1',
  teamUid: 't1',
  teamName: 'Protocol Labs',
  teamLogoUrl: null,
  eventType: 'FUNDING',
  eventDate: '2026-11-01T00:00:00.000Z',
  title: 'Series A closed',
  summary: null,
  sourceUrl: 'https://example.com/a',
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-11-01T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  ...overrides,
});

describe('the Top category', () => {
  it.each([1, 2, 3, 4, 5])('holds editorial rank %i', (rank) => {
    expect(matchesTeamNewsCategory(item({ editorialRank: rank }), TOP_CAT)).toBe(true);
  });

  it.each([0, 6, null, undefined])('leaves out rank %p', (rank) => {
    expect(matchesTeamNewsCategory(item({ editorialRank: rank as number | null }), TOP_CAT)).toBe(false);
  });
});

describe('matchesStreamNewsCategory', () => {
  const threaded = item({ discussion: { count: 2, latestTopicUrl: 'https://forum/1' } });

  it('keeps a story with a forum thread out of Discussions, which is forum posts only on the stream', () => {
    expect(matchesTeamNewsCategory(threaded, DISCUSSIONS_CAT)).toBe(true);
    expect(matchesStreamNewsCategory(threaded, DISCUSSIONS_CAT)).toBe(false);
  });

  it('matches everything else as the grouped feed does', () => {
    expect(matchesStreamNewsCategory(threaded, ALL_CAT)).toBe(true);
    expect(matchesStreamNewsCategory(threaded, 'FUNDING')).toBe(true);
    expect(matchesStreamNewsCategory(threaded, 'LAUNCH')).toBe(false);
    expect(matchesStreamNewsCategory(item({ editorialRank: 2 }), TOP_CAT)).toBe(true);
  });
});

describe('a hashtag search', () => {
  const tagged = item({ title: 'Robots ship', tags: ['ai', 'robotics'] });

  it('drops leading #s, so #ai matches the tag ai', () => {
    expect(matchesTeamNewsQuery(tagged, '#ai')).toBe(true);
    expect(matchesTeamNewsQuery(tagged, '##robotics')).toBe(true);
    expect(matchesTeamNewsQuery(tagged, '#storage')).toBe(false);
  });

  it('matches everything on a bare #, as on an empty query', () => {
    expect(matchesTeamNewsQuery(tagged, '#')).toBe(true);
  });
});

describe('newsItemHasAllTags', () => {
  const both = item({ tags: ['AI', ' robotics '] });

  it('needs every tag in the scope, compared as the chips are (trimmed, lower-case)', () => {
    expect(newsItemHasAllTags(both, ['ai'])).toBe(true);
    expect(newsItemHasAllTags(both, ['ai', 'robotics'])).toBe(true);
    expect(newsItemHasAllTags(both, ['ai', 'storage'])).toBe(false);
  });

  it('matches everything on an empty scope', () => {
    expect(newsItemHasAllTags(item(), [])).toBe(true);
  });
});

describe('selectNarrowByTags', () => {
  const tagsOf = (i: ITeamNewsItem) => i.tags;
  const inScope = [
    item({ uid: '1', tags: ['ai', 'robotics', 'storage'] }),
    item({ uid: '2', tags: ['ai', 'robotics', 'defi'] }),
    item({ uid: '3', tags: ['ai', 'storage', 'robotics'] }),
    item({ uid: '4', tags: ['ai', 'vr', 'defi'] }),
    item({ uid: '5', tags: ['ai', 'bio'] }),
  ];

  it('offers the three commonest other tags, ties in the order first seen', () => {
    expect(selectNarrowByTags(inScope, ['ai'], tagsOf)).toEqual(['robotics', 'storage', 'defi']);
  });

  it('leaves out a tag every story in scope carries: it would not narrow anything', () => {
    const allRobotics = inScope.slice(0, 3);
    expect(selectNarrowByTags(allRobotics, ['ai'], tagsOf)).toEqual(['storage', 'defi']);
  });

  it('offers nothing without a scope', () => {
    expect(selectNarrowByTags(inScope, [], tagsOf)).toEqual([]);
  });

  it("uses the cards' vocabulary: topics with News preferences on, every non-verb tag with it off", () => {
    const story = item({ tags: ['launch', 'ai', 'mainnet'] });
    expect(chipVocabulary(story, new Set(['ai']), true)).toEqual(['ai']);
    expect(chipVocabulary(story, null, true)).toEqual([]);
    expect(chipVocabulary(story, null, false)).toEqual(['ai', 'mainnet']);
  });
});

describe('computeStreamCut', () => {
  // 200px cards, 20px apart.
  const cards = Array.from({ length: 6 }, (_, i) => ({ offsetTop: i * 220, offsetHeight: 200 }));

  it('beside the rail, keeps every card ending above the rail whole and ends at the rail', () => {
    expect(computeStreamCut(cards, 1000)).toEqual({ full: 4, clip: 1000 });
  });

  it('beside a short rail, keeps at least four cards and 24px of the next', () => {
    // Four cards end at 860. The fifth starts at 880, so the clip is 904.
    expect(computeStreamCut(cards, 650)).toEqual({ full: 4, clip: 904 });
    expect(computeStreamCut(cards, 100)).toEqual({ full: 4, clip: 904 });
  });

  it('stacked, keeps three cards and 140px of the fourth', () => {
    expect(computeStreamCut(cards, null)).toEqual({ full: 3, clip: 660 + 140 });
  });

  it('does not cut a list that ends before the cut', () => {
    expect(computeStreamCut(cards.slice(0, 2), 900)).toEqual({ full: 2 });
    expect(computeStreamCut(cards.slice(0, 3), null)).toEqual({ full: 3 });
  });
});
