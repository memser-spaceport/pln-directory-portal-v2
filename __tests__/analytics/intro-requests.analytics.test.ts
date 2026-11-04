import { renderHook, act } from '@testing-library/react';

import { useIntroRequestAnalytics } from '@/analytics/intro-requests.analytics';
import { INTRO_REQUEST_ANALYTICS_EVENTS } from '@/utils/constants';

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

describe('useIntroRequestAnalytics', () => {
  afterEach(() => {
    capture.mockClear();
  });

  it('captures ask-submitted with type and target type', () => {
    const { result } = renderHook(() => useIntroRequestAnalytics());

    act(() => {
      result.current.onAskSubmitted('member');
    });

    expect(capture).toHaveBeenCalledWith(INTRO_REQUEST_ANALYTICS_EVENTS.ASK_SUBMITTED, {
      type: 'intro',
      targetType: 'member',
      loggedInUserUid: 'u1',
      loggedInUserEmail: 'ada@example.com',
      loggedInUserName: 'Ada Lovelace',
    });
  });
});
