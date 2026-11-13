import { renderHook } from '@testing-library/react';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import { useCurrentUserStore } from '@/services/auth/store';

const capture = jest.fn();
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ capture }) }));

describe('event drawer analytics (LAB-3216)', () => {
  beforeEach(() => {
    capture.mockClear();
    useCurrentUserStore.setState({ currentUser: { uid: 'me', name: 'Me', email: 'me@example.com' } as never });
  });

  const run = () => renderHook(() => useEventsAnalytics()).result.current;
  const last = () => {
    const [name, params] = capture.mock.calls[capture.mock.calls.length - 1];
    const { loggedInUserUid, loggedInUserEmail, loggedInUserName, ...rest } = params;
    return [name, rest];
  };

  it.each([
    [
      'onEventDrawerOpened',
      { eventUid: 'e', source: 'home' },
      'event-drawer-opened',
      { event_uid: 'e', source: 'home' },
    ],
    [
      'onEventGoingMarked',
      { eventUid: 'e', source: 'member-profile' },
      'event-going-marked',
      { event_uid: 'e', source: 'member-profile' },
    ],
    ['onEventNotGoingMarked', { eventUid: 'e' }, 'event-not-going-marked', { event_uid: 'e' }],
    [
      'onEventPlansSaved',
      { eventUid: 'e', roles: ['Speaker'] },
      'event-plans-saved',
      { event_uid: 'e', roles: ['Speaker'] },
    ],
    ['onEventAttendeesOpened', { eventUid: 'e' }, 'event-attendees-opened', { event_uid: 'e' }],
  ] as const)('%s captures %s', (fn, args, name, params) => {
    (run()[fn] as (a: typeof args) => void)(args);
    expect(last()).toEqual([name, params]);
    expect(capture.mock.calls[0][1].loggedInUserUid).toBe('me');
  });
});
