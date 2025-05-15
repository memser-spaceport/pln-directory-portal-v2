import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberOfficeHours from '@/components/page/member-details/member-office-hours';

// --- Mocks ---
const onLoginBtnClicked = jest.fn();
const onAddOfficeHourClicked = jest.fn();
const onEditOfficeHourClicked = jest.fn();
const onOfficeHourClicked = jest.fn();
const onLearnMoreClicked = jest.fn();
const push = jest.fn();
const refresh = jest.fn();
const createFollowUp = jest.fn();
const getFollowUps = jest.fn();
const triggerLoader = jest.fn();
const toastError = jest.fn();
const getAnalyticsUserInfo = jest.fn(() => ({}));
const getAnalyticsMemberInfo = jest.fn(() => ({}));
const getParsedValue = jest.fn(() => 'token');

jest.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));
jest.mock('@/analytics/auth.analytics', () => ({ useAuthAnalytics: () => ({ onLoginBtnClicked }) }));
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({
    onAddOfficeHourClicked,
    onEditOfficeHourClicked,
    onOfficeHourClicked,
    onLearnMoreClicked,
  }),
}));
jest.mock('@/services/office-hours.service', () => ({
  createFollowUp: (...args: any[]) => createFollowUp(...args),
  getFollowUps: (...args: any[]) => getFollowUps(...args),
}));
jest.mock('js-cookie', () => ({ get: () => 'cookie-token' }));
jest.mock('react-toastify', () => ({ toast: { error: (...args: any[]) => toastError(...args) } }));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: () => getAnalyticsUserInfo(),
  getAnalyticsMemberInfo: () => getAnalyticsMemberInfo(),
  getParsedValue: () => getParsedValue(),
  triggerLoader: (...args: any[]) => triggerLoader(...args),
}));

beforeAll(() => {
  jest.spyOn(window, 'open').mockImplementation(() => null);
});

describe('MemberOfficeHours', () => {
  const baseProps: any = {
    member: { id: 'm1', name: 'Test Member', officeHours: 'https://cal.com/test' },
    isLoggedIn: true,
    userInfo: { uid: 'u1', name: 'User' },
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders office hours title and learn more button when logged in', () => {
    render(<MemberOfficeHours {...baseProps} />);
    expect(screen.getByText('Office Hours')).toBeInTheDocument();
    expect(screen.getByText('Learn more')).toBeInTheDocument();
  });

  it('renders login prompt and login button when not logged in', () => {
    render(<MemberOfficeHours {...baseProps} isLoggedIn={false} />);
    expect(screen.getByText(/Login to Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Member/)).toBeInTheDocument();
  });

  it('calls analytics and router.push on login button click', () => {
    render(<MemberOfficeHours {...baseProps} isLoggedIn={false} />);
    fireEvent.click(screen.getByText(/Login to Schedule/i));
    expect(onLoginBtnClicked).toHaveBeenCalled();
    expect(push).toHaveBeenCalled();
  });

  it('shows Edit Office Hours button for self and calls analytics on click', () => {
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'm1', name: 'Test Member' }} />);
    const btn = screen.getByText('Edit Office Hours');
    fireEvent.click(btn);
    expect(onEditOfficeHourClicked).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/settings/profile');
  });

  it('shows Add Office Hours button for self if no officeHours', () => {
    render(<MemberOfficeHours {...baseProps} member={{ ...baseProps.member, officeHours: null }} userInfo={{ uid: 'm1', name: 'Test Member' }} />);
    expect(screen.getByText('Add Office Hours')).toBeInTheDocument();
  });

  it('shows Not Available button for other users if no officeHours', () => {
    render(<MemberOfficeHours {...baseProps} member={{ ...baseProps.member, officeHours: null }} userInfo={{ uid: 'u2', name: 'Other' }} />);
    expect(screen.getByText('Not Available')).toBeDisabled();
  });

  it('calls analytics and router.push on Add Office Hours click', () => {
    render(<MemberOfficeHours {...baseProps} member={{ ...baseProps.member, officeHours: null }} userInfo={{ uid: 'm1', name: 'Test Member' }} />);
    fireEvent.click(screen.getByText('Add Office Hours'));
    expect(onAddOfficeHourClicked).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/settings/profile');
  });

  it('calls analytics on Learn more click', () => {
    render(<MemberOfficeHours {...baseProps} />);
    fireEvent.click(screen.getByText('Learn more'));
    expect(onLearnMoreClicked).toHaveBeenCalled();
  });

  it('shows error toast for forbidden self interaction', async () => {
    createFollowUp.mockResolvedValueOnce({ error: { data: { message: 'yourself is forbidden' } } });
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
  });

  it('shows error toast for 30min restriction', async () => {
    createFollowUp.mockResolvedValueOnce({ error: { data: { message: 'Interaction with same user within 30 minutes is forbidden' } } });
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
  });

  it('handles API error and logs it', async () => {
    const error = new Error('fail');
    createFollowUp.mockRejectedValueOnce(error);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(error);
    });
    spy.mockRestore();
  });

  it('dispatches events and refreshes router after successful followup', async () => {
    createFollowUp.mockResolvedValueOnce({});
    getFollowUps.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    await waitFor(() => {
      expect(dispatchEventSpy).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
    });
    dispatchEventSpy.mockRestore();
  });

  it('does not dispatch events if getFollowUps returns error', async () => {
    createFollowUp.mockResolvedValueOnce({});
    getFollowUps.mockResolvedValueOnce({ error: true });
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    await waitFor(() => {
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });
    dispatchEventSpy.mockRestore();
  });

  it('handles getFollowUps with no results (result.length === 0)', async () => {
    createFollowUp.mockResolvedValueOnce({});
    getFollowUps.mockResolvedValueOnce({ data: [] });
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    jest.runAllTimers();
    await waitFor(() => {
      expect(dispatchEventSpy).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    });
    dispatchEventSpy.mockRestore();
  });

  it('handles error response with an unknown message (no toast)', async () => {
    createFollowUp.mockResolvedValueOnce({ error: { data: { message: 'some other error' } } });
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    await waitFor(() => {
      expect(triggerLoader).toHaveBeenCalledWith(false);
      expect(toastError).not.toHaveBeenCalled();
    });
  });

  it('handles error response with no message (no toast)', async () => {
    createFollowUp.mockResolvedValueOnce({ error: { data: {} } });
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    await waitFor(() => {
      expect(triggerLoader).toHaveBeenCalledWith(false);
      expect(toastError).not.toHaveBeenCalled();
    });
  });

  it('handles getFollowUps returning undefined', async () => {
    createFollowUp.mockResolvedValueOnce({});
    getFollowUps.mockResolvedValueOnce(undefined);
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    jest.runAllTimers();
    await waitFor(() => {
      expect(dispatchEventSpy).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    });
    dispatchEventSpy.mockRestore();
  });

  it('handles getFollowUps with undefined result', async () => {
    createFollowUp.mockResolvedValueOnce({});
    getFollowUps.mockResolvedValueOnce({ data: undefined });
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    jest.runAllTimers();
    await waitFor(() => {
      expect(dispatchEventSpy).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    });
    dispatchEventSpy.mockRestore();
  });

  it('handles getFollowUps with error property false and result with items', async () => {
    createFollowUp.mockResolvedValueOnce({});
    getFollowUps.mockResolvedValueOnce({ error: false, data: [{ id: 123 }] });
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    jest.runAllTimers();
    await waitFor(() => {
      expect(dispatchEventSpy).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
    });
    dispatchEventSpy.mockRestore();
  });

  it('handles getFollowUps with error property undefined and empty result', async () => {
    createFollowUp.mockResolvedValueOnce({});
    getFollowUps.mockResolvedValueOnce({ data: [] });
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    render(<MemberOfficeHours {...baseProps} userInfo={{ uid: 'u2', name: 'Other' }} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    jest.runAllTimers();
    await waitFor(() => {
      expect(dispatchEventSpy).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    });
    dispatchEventSpy.mockRestore();
  });
}); 