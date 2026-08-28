import { renderHook, act } from '@testing-library/react';

import { useMcpAnalytics } from '@/analytics/mcp.analytics';
import { MCP_ANALYTICS_EVENTS } from '@/utils/constants';

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

describe('useMcpAnalytics', () => {
  afterEach(() => {
    capture.mockClear();
  });

  it('captures connect events with user props and no secrets', () => {
    const { result } = renderHook(() => useMcpAnalytics());

    act(() => {
      result.current.onConnectPageViewed({ view: 'pending', clientId: 'mcp_client_abc' });
      result.current.onConnectApproved({ clientId: 'mcp_client_abc' });
    });

    expect(capture).toHaveBeenCalledWith(MCP_ANALYTICS_EVENTS.CONNECT_PAGE_VIEWED, {
      view: 'pending',
      clientId: 'mcp_client_abc',
      loggedInUserUid: 'u1',
      loggedInUserEmail: 'ada@example.com',
      loggedInUserName: 'Ada Lovelace',
    });
    expect(capture).toHaveBeenCalledWith(
      MCP_ANALYTICS_EVENTS.CONNECT_APPROVED,
      expect.objectContaining({ clientId: 'mcp_client_abc' }),
    );
  });

  it('captures warm-path events without note text', () => {
    const { result } = renderHook(() => useMcpAnalytics());
    const params = { warmPathUid: 'p1', investorProfileUid: 'inv1', isEdit: false };

    act(() => {
      result.current.onWarmPathFeedbackSubmitted(params);
      result.current.onWarmPathNoteCleared({ warmPathUid: 'p1', investorProfileUid: 'inv1' });
    });

    expect(capture).toHaveBeenCalledWith(MCP_ANALYTICS_EVENTS.WARM_PATH_FEEDBACK_SUBMITTED, {
      ...params,
      loggedInUserUid: 'u1',
      loggedInUserEmail: 'ada@example.com',
      loggedInUserName: 'Ada Lovelace',
    });
    const submittedProps = capture.mock.calls.find(
      ([event]) => event === MCP_ANALYTICS_EVENTS.WARM_PATH_FEEDBACK_SUBMITTED,
    )?.[1];
    expect(submittedProps).not.toHaveProperty('note');
    expect(JSON.stringify(submittedProps)).not.toMatch(/Waiting on a reply/);
  });
});
