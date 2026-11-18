import { renderHook, act } from '@testing-library/react';

import { useIntroRequestAnalytics, type IntroRequestEventContext } from '@/analytics/intro-requests.analytics';
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

const context: IntroRequestEventContext = { targetType: 'member', entryPoint: 'member-header', source: 'modal' };

function lastProperties(): Record<string, unknown> {
  return capture.mock.calls[capture.mock.calls.length - 1][1];
}

function expectNoPersonalData(properties: Record<string, unknown>) {
  expect(properties).not.toHaveProperty('loggedInUserEmail');
  expect(properties).not.toHaveProperty('loggedInUserName');
  expect(properties).not.toHaveProperty('text');
  expect(JSON.stringify(properties)).not.toContain('ada@example.com');
  expect(JSON.stringify(properties)).not.toContain('Ada Lovelace');
}

describe('useIntroRequestAnalytics', () => {
  afterEach(() => {
    capture.mockClear();
  });

  it('captures intro-request-button-shown with the shared properties', () => {
    const { result } = renderHook(() => useIntroRequestAnalytics());
    act(() => result.current.onButtonShown({ targetType: 'team', entryPoint: 'team-header', source: 'modal' }));

    expect(INTRO_REQUEST_ANALYTICS_EVENTS.BUTTON_SHOWN).toBe('intro-request-button-shown');
    expect(capture).toHaveBeenCalledWith('intro-request-button-shown', {
      targetType: 'team',
      entryPoint: 'team-header',
      source: 'modal',
      loggedInUserUid: 'u1',
    });
    expectNoPersonalData(lastProperties());
  });

  it('captures intro-request-dialog-opened with the shared properties', () => {
    const { result } = renderHook(() => useIntroRequestAnalytics());
    act(() => result.current.onDialogOpened(context));

    expect(capture).toHaveBeenCalledWith('intro-request-dialog-opened', { ...context, loggedInUserUid: 'u1' });
    expectNoPersonalData(lastProperties());
  });

  it('captures intro-request-dialog-closed with hadText and textLength', () => {
    const { result } = renderHook(() => useIntroRequestAnalytics());
    act(() => result.current.onDialogClosed({ ...context, hadText: true, textLength: 12 }));

    expect(capture).toHaveBeenCalledWith('intro-request-dialog-closed', {
      ...context,
      hadText: true,
      textLength: 12,
      loggedInUserUid: 'u1',
    });
    expectNoPersonalData(lastProperties());
  });

  it('captures intro-request-submit-failed with status and textLength', () => {
    const { result } = renderHook(() => useIntroRequestAnalytics());
    act(() => result.current.onSubmitFailed({ ...context, status: 403, textLength: 25 }));

    expect(capture).toHaveBeenCalledWith('intro-request-submit-failed', {
      ...context,
      status: 403,
      textLength: 25,
      loggedInUserUid: 'u1',
    });
    expectNoPersonalData(lastProperties());
  });

  it('captures ask-submitted with entryPoint, source and textLength, and no email or name', () => {
    const { result } = renderHook(() => useIntroRequestAnalytics());
    act(() => result.current.onAskSubmitted({ ...context, textLength: 30 }));

    expect(capture).toHaveBeenCalledWith(INTRO_REQUEST_ANALYTICS_EVENTS.ASK_SUBMITTED, {
      type: 'intro',
      ...context,
      textLength: 30,
      loggedInUserUid: 'u1',
    });
    expect(INTRO_REQUEST_ANALYTICS_EVENTS.ASK_SUBMITTED).toBe('ask-submitted');
    expectNoPersonalData(lastProperties());
  });
});
