import {
  getTeamNewsByTeamNextPageParam,
  hasTeamNewsItems,
} from '@/services/team-news/team-news.utils';

describe('hasTeamNewsItems', () => {
  it('returns false for null, undefined, and zero totals', () => {
    expect(hasTeamNewsItems(null)).toBe(false);
    expect(hasTeamNewsItems(undefined)).toBe(false);
    expect(
      hasTeamNewsItems({
        teamUid: 'team-1',
        teamName: 'Acme',
        page: 1,
        limit: 3,
        total: 0,
        items: [],
      }),
    ).toBe(false);
  });

  it('returns true when total is greater than zero', () => {
    expect(
      hasTeamNewsItems({
        teamUid: 'team-1',
        teamName: 'Acme',
        page: 1,
        limit: 3,
        total: 2,
        items: [],
      }),
    ).toBe(true);
  });
});

describe('getTeamNewsByTeamNextPageParam', () => {
  it('returns the next page when more items exist', () => {
    expect(
      getTeamNewsByTeamNextPageParam({
        teamUid: 'team-1',
        teamName: 'Acme',
        page: 1,
        limit: 20,
        total: 45,
        items: [],
      }),
    ).toBe(2);
  });

  it('returns undefined on the final page', () => {
    expect(
      getTeamNewsByTeamNextPageParam({
        teamUid: 'team-1',
        teamName: 'Acme',
        page: 3,
        limit: 20,
        total: 45,
        items: [],
      }),
    ).toBeUndefined();
  });
});
