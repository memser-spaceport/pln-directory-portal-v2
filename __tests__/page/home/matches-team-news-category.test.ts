import { matchesTeamNewsCategory } from '@/components/page/home/TeamNews/utils/matchesTeamNewsCategory';
import { hasExistingDiscussion } from '@/components/page/home/TeamNews/utils/hasExistingDiscussion';
import { ALL_CAT, DISCUSSIONS_CAT } from '@/components/page/home/TeamNews/constants';
import type { ITeamNewsDiscussion, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

function item(overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem {
  return {
    uid: 'n1',
    teamUid: 't1',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'FUNDING',
    eventDate: '2026-08-01T00:00:00.000Z',
    title: 'Series A closed',
    summary: null,
    sourceUrl: 'https://example.com/a',
    sourceDomain: 'example.com',
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    discussion: { count: 0, latestTopicUrl: null },
    ...overrides,
  };
}

const discussion = (d: Partial<ITeamNewsDiscussion>): ITeamNewsDiscussion => ({
  count: 0,
  latestTopicUrl: null,
  ...d,
});

describe('hasExistingDiscussion', () => {
  it('needs both a count and a topic to link to', () => {
    expect(hasExistingDiscussion(discussion({ count: 3, latestTopicUrl: 'https://forum/1' }))).toBe(true);
  });

  it('rejects a counted discussion with no URL — there is nothing to open', () => {
    expect(hasExistingDiscussion(discussion({ count: 3, latestTopicUrl: null }))).toBe(false);
    expect(hasExistingDiscussion(discussion({ count: 3, latestTopicUrl: '' }))).toBe(false);
  });

  it('rejects a URL with a zero count — the thread exists but nobody has posted', () => {
    expect(hasExistingDiscussion(discussion({ count: 0, latestTopicUrl: 'https://forum/1' }))).toBe(false);
  });
});

describe('matchesTeamNewsCategory', () => {
  it('matches everything under the "all" pill', () => {
    expect(matchesTeamNewsCategory(item({ eventType: 'HIRING' }), ALL_CAT)).toBe(true);
    expect(matchesTeamNewsCategory(item({ discussion: discussion({}) }), ALL_CAT)).toBe(true);
  });

  it('matches on event type for a concrete category', () => {
    const funding = item({ eventType: 'FUNDING' });
    expect(matchesTeamNewsCategory(funding, 'FUNDING')).toBe(true);
    expect(matchesTeamNewsCategory(funding, 'LAUNCH')).toBe(false);
  });

  it.each<TeamNewsEventType>([
    'FUNDING',
    'LAUNCH',
    'PARTNERSHIP',
    'ANNOUNCEMENT',
    'MILESTONE',
    'DEALS',
    'HIRING',
    'OTHER',
  ])('matches %s against itself and nothing else', (eventType) => {
    expect(matchesTeamNewsCategory(item({ eventType }), eventType)).toBe(true);
    expect(matchesTeamNewsCategory(item({ eventType }), eventType === 'OTHER' ? 'FUNDING' : 'OTHER')).toBe(false);
  });

  it('puts a news item under "discussions" only when it has a real forum thread', () => {
    const withThread = item({ discussion: discussion({ count: 2, latestTopicUrl: 'https://forum/1' }) });
    const withoutThread = item({ discussion: discussion({ count: 0, latestTopicUrl: null }) });

    expect(matchesTeamNewsCategory(withThread, DISCUSSIONS_CAT)).toBe(true);
    expect(matchesTeamNewsCategory(withoutThread, DISCUSSIONS_CAT)).toBe(false);
  });

  it('ignores the event type when the category is "discussions"', () => {
    const anyType = item({
      eventType: 'MILESTONE',
      discussion: discussion({ count: 1, latestTopicUrl: 'https://forum/9' }),
    });
    expect(matchesTeamNewsCategory(anyType, DISCUSSIONS_CAT)).toBe(true);
  });
});
