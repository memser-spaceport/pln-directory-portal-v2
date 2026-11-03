import { act, renderHook } from '@testing-library/react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { TEAM_NEWS_ANALYTICS_EVENTS } from '@/utils/constants';

const capture = jest.fn();

jest.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: Object.assign(jest.fn(), {
    getState: () => ({
      currentUser: { uid: 'u1', email: 'ada@example.com', name: 'Ada Lovelace' },
    }),
  }),
}));

describe('onTeamNewsScrollDepth', () => {
  afterEach(() => capture.mockClear());

  it.each([
    [50, 'team-news-scroll-depth-50'],
    [70, 'team-news-scroll-depth-70'],
    [90, 'team-news-scroll-depth-90'],
  ] as const)('sends the %i%% step as %s with the feed context', (depth, eventName) => {
    const { result } = renderHook(() => useTeamNewsAnalytics());

    act(() => {
      result.current.onTeamNewsScrollDepth(depth, {
        category: 'for-you',
        tab: 'All',
        sort: 'latest',
        cardsSeen: 5,
        cardsLoaded: 6,
      });
    });

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(eventName, {
      scrollDepth: `${depth}%`,
      category: 'for-you',
      tab: 'All',
      sort: 'latest',
      cardsSeen: 5,
      cardsLoaded: 6,
      source: 'home',
      loggedInUserUid: 'u1',
      loggedInUserEmail: 'ada@example.com',
      loggedInUserName: 'Ada Lovelace',
    });
  });

  it('names the three events in the Team News constants', () => {
    expect(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_SCROLL_DEPTH_50).toBe('team-news-scroll-depth-50');
    expect(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_SCROLL_DEPTH_70).toBe('team-news-scroll-depth-70');
    expect(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_SCROLL_DEPTH_90).toBe('team-news-scroll-depth-90');
  });
});
