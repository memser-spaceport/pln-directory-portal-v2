import { renderHook } from '@testing-library/react';

import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';
import { UNIFIED_SEARCH_ANALYTICS_EVENTS } from '@/utils/constants';

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

describe('useUnifiedSearchAnalytics.onAiQuerySubmitted', () => {
  afterEach(() => {
    capture.mockClear();
  });

  it('sends the member-side ask event with the trimmed query, entry point, submit type and user props', () => {
    const { result } = renderHook(() => useUnifiedSearchAnalytics());

    result.current.onAiQuerySubmitted('  who works on zk?  ', 'header-dialog', 'user-input');

    expect(UNIFIED_SEARCH_ANALYTICS_EVENTS.AI_QUERY_SUBMITTED).toBe('unified-search-ai-query-submitted');
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith('unified-search-ai-query-submitted', {
      searchValue: 'who works on zk?',
      entryPoint: 'header-dialog',
      submitType: 'user-input',
      loggedInUserUid: 'u1',
      loggedInUserEmail: 'ada@example.com',
      loggedInUserName: 'Ada Lovelace',
    });
  });

  it('cuts the query to 500 characters', () => {
    const { result } = renderHook(() => useUnifiedSearchAnalytics());

    result.current.onAiQuerySubmitted('a'.repeat(600), 'ai-search-page', 'followup');

    expect(capture.mock.calls[0][1].searchValue).toHaveLength(500);
  });

  it('sends nothing for an empty or whitespace-only query', () => {
    const { result } = renderHook(() => useUnifiedSearchAnalytics());

    result.current.onAiQuerySubmitted('', 'home', 'user-input');
    result.current.onAiQuerySubmitted('   \n ', 'home', 'user-input');

    expect(capture).not.toHaveBeenCalled();
  });
});

describe('useUnifiedSearchAnalytics.onEmailQuerySubmitted (LAB-2881)', () => {
  afterEach(() => {
    capture.mockClear();
  });

  it('sends the email-query event with the user props and no search text', () => {
    const { result } = renderHook(() => useUnifiedSearchAnalytics());

    result.current.onEmailQuerySubmitted();

    expect(UNIFIED_SEARCH_ANALYTICS_EVENTS.EMAIL_QUERY_SUBMITTED).toBe('unified-search-email-query-submitted');
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith('unified-search-email-query-submitted', {
      loggedInUserUid: 'u1',
      loggedInUserEmail: 'ada@example.com',
      loggedInUserName: 'Ada Lovelace',
    });
  });
});
