import { renderHook } from '@testing-library/react';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { EVENTS_SUBMIT_ANALYTICS } from '@/utils/constants';

/* The submit form, edit page and My Submissions events: seven names, and no email or event text in any of them. */

const capture = jest.fn();
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ capture }) }));

const member = { uid: 'm1', email: 'ann@example.com', name: 'Ann Member' };

beforeEach(() => {
  capture.mockReset();
  useCurrentUserStore.setState({ currentUser: member } as never);
});

function fireAll() {
  const { result } = renderHook(() => useEventsAnalytics());
  result.current.onEventsSubmitFormOpened();
  result.current.onEventsSubmitFormSubmitted({ result: 'approved', signedIn: true });
  result.current.onEventsSubmitFormFailed({ status: 429 });
  result.current.onEventsLumaImported();
  result.current.onEventsMySubmissionsOpened();
  result.current.onEventsEventEdited({ eventUid: 'e1', action: 'updated' });
  result.current.onEventsEventDeleted({ eventUid: 'e1', from: 'my-submissions' });
}

describe('events submit analytics', () => {
  it('sends the seven events by name', () => {
    fireAll();
    expect(capture.mock.calls.map(([name]) => name)).toEqual([
      'events-submit-form-opened',
      'events-submit-form-submitted',
      'events-submit-form-failed',
      'events-luma-imported',
      'events-my-submissions-opened',
      'events-event-edited',
      'events-event-deleted',
    ]);
    expect(Object.values(EVENTS_SUBMIT_ANALYTICS)).toHaveLength(7);
  });

  it('sends a published submission with result approved and signed in true', () => {
    const { result } = renderHook(() => useEventsAnalytics());
    result.current.onEventsSubmitFormSubmitted({ result: 'approved', signedIn: true });
    expect(capture).toHaveBeenCalledWith('events-submit-form-submitted', {
      result: 'approved',
      signed_in: true,
      loggedInUserUid: 'm1',
      is_authenticated: true,
    });
  });

  it('never carries an email, a name or event text', () => {
    fireAll();
    const allowed = [
      'result',
      'signed_in',
      'status',
      'event_uid',
      'action',
      'from',
      'loggedInUserUid',
      'is_authenticated',
    ];
    capture.mock.calls.forEach(([, props]) => {
      expect(Object.keys(props).filter((key) => !allowed.includes(key))).toEqual([]);
      const text = JSON.stringify(props);
      expect(text).not.toContain(member.email);
      expect(text).not.toContain(member.name);
    });
  });

  it('marks a signed-out visitor', () => {
    useCurrentUserStore.setState({ currentUser: null } as never);
    const { result } = renderHook(() => useEventsAnalytics());
    result.current.onEventsSubmitFormSubmitted({ result: 'submitted', signedIn: false });
    expect(capture).toHaveBeenCalledWith('events-submit-form-submitted', {
      result: 'submitted',
      signed_in: false,
      loggedInUserUid: null,
      is_authenticated: false,
    });
  });
});
