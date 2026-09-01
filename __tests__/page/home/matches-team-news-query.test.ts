import { matchesTeamNewsQuery } from '@/components/page/home/TeamNews/utils/matchesTeamNewsQuery';
import type { ITeamNewsItem } from '@/types/team-news.types';

function item(overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem {
  return {
    uid: 'n1',
    teamUid: 't1',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'FUNDING',
    eventDate: '2026-08-01T00:00:00.000Z',
    title: 'Series A closed',
    summary: 'Raised to grow the storage network',
    sourceUrl: 'https://example.com/a',
    sourceDomain: 'example.com',
    tags: ['Storage', 'Funding'],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    discussion: { count: 0, latestTopicUrl: null },
    ...overrides,
  };
}

describe('matchesTeamNewsQuery', () => {
  it('matches everything when the query is empty — an empty search is not a filter', () => {
    expect(matchesTeamNewsQuery(item(), '')).toBe(true);
  });

  it('matches on team name, title, summary and tags', () => {
    expect(matchesTeamNewsQuery(item(), 'protocol')).toBe(true);
    expect(matchesTeamNewsQuery(item(), 'series')).toBe(true);
    expect(matchesTeamNewsQuery(item(), 'storage network')).toBe(true);
    expect(matchesTeamNewsQuery(item(), 'storage')).toBe(true);
  });

  it('matches on a substring, not just a prefix', () => {
    expect(matchesTeamNewsQuery(item({ title: 'Announcing Saturn' }), 'turn')).toBe(true);
  });

  it('is case-insensitive on the item side — the caller lowercases the query', () => {
    expect(matchesTeamNewsQuery(item({ teamName: 'PROTOCOL LABS' }), 'protocol')).toBe(true);
    expect(matchesTeamNewsQuery(item({ tags: ['STORAGE'] }), 'storage')).toBe(true);
  });

  it('survives a null summary instead of throwing', () => {
    expect(matchesTeamNewsQuery(item({ summary: null }), 'series')).toBe(true);
    expect(matchesTeamNewsQuery(item({ summary: null }), 'nothing here')).toBe(false);
  });

  it('rejects an item nothing on it mentions', () => {
    expect(matchesTeamNewsQuery(item(), 'kubernetes')).toBe(false);
  });

  it('matches any tag, not only the first', () => {
    expect(matchesTeamNewsQuery(item({ tags: ['Storage', 'Compute'] }), 'compute')).toBe(true);
    expect(matchesTeamNewsQuery(item({ tags: [] }), 'compute')).toBe(false);
  });
});
