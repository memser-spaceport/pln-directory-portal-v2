import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelfEmailUpdate from '../../../components/page/member-info/self-email-update';
import * as analyticsModule from '@/analytics/auth.analytics';
import * as commonUtils from '@/utils/common.utils';

// --- Mocks ---
const onUpdateSameEmailProvidedMock = jest.fn();
const onUpdateEmailClickedMock = jest.fn();
const onUpdateEmailSuccessMock = jest.fn();
const onUpdateEmailFailureMock = jest.fn();

jest.mock('@/analytics/auth.analytics', () => ({
  useAuthAnalytics: () => ({
    onUpdateEmailClicked: onUpdateEmailClickedMock,
    onUpdateSameEmailProvided: onUpdateSameEmailProvidedMock,
    onUpdateEmailSuccess: onUpdateEmailSuccessMock,
    onUpdateEmailFailure: onUpdateEmailFailureMock,
  }),
}));
jest.mock('@/utils/third-party.helper', () => ({
  getUserInfo: () => ({ id: 'user-1', email: 'user@site.com' }),
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ id: 'user-1' })),
  triggerLoader: jest.fn(),
}));
jest.mock('@/utils/auth.utils', () => ({
  decodeToken: jest.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 3600 })),
}));
jest.mock('@/services/members.service', () => ({
  updateUserDirectoryEmail: jest.fn(async () => ({
    refreshToken: 'refresh-token',
    accessToken: 'access-token',
    userInfo: { id: 'user-1', email: 'new@site.com' },
  })),
}));

// Mock toast
const toastSuccess = jest.fn();
const toastError = jest.fn();
jest.mock('react-toastify', () => ({
  toast: {
    success: (...args: any[]) => toastSuccess(...args),
    error: (...args: any[]) => toastError(...args),
  },
}));

// Mock Cookies
let cookies: Record<string, string> = {};
jest.mock('js-cookie', () => ({
  get: (key: string) => cookies[key],
  set: (key: string, value: string) => {
    cookies[key] = value;
  },
}));

const originalLocation = window.location;

beforeAll(() => {
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { ...originalLocation, reload: jest.fn() };
});

afterAll(() => {
  window.location = originalLocation;
});

describe('SelfEmailUpdate', () => {
  const baseEmail = 'test@example.com';
  const baseUid = 'user-123';
  const defaultProps = {
    email: baseEmail,
    uid: baseUid,
  };

  beforeEach(() => {
    cookies = { authToken: '"token-value"', refreshToken: '"refresh-token"', userInfo: '{"id":"user-1"}' };
    jest.clearAllMocks();
  });

  it('renders the email and edit button', () => {
    render(<SelfEmailUpdate {...defaultProps} />);
    expect(screen.getByTestId('email-display')).toHaveTextContent(baseEmail);
    expect(screen.getByTestId('edit-email-btn')).toBeInTheDocument();
    expect(screen.getByTestId('hidden-email-input')).toHaveAttribute('value', baseEmail);
  });

  it('calls analytics and dispatches event on edit click if authToken exists', () => {
    const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
    render(<SelfEmailUpdate {...defaultProps} />);
    fireEvent.click(screen.getByTestId('edit-email-btn'));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth-link-account' }));
  });

  it('does not dispatch event if no authToken', () => {
    cookies = {}; // No authToken
    const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
    render(<SelfEmailUpdate {...defaultProps} />);
    fireEvent.click(screen.getByTestId('edit-email-btn'));
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'auth-link-account' }));
  });

  it('updates currentEmail when email prop changes', () => {
    const { rerender } = render(<SelfEmailUpdate {...defaultProps} />);
    expect(screen.getByTestId('hidden-email-input')).toHaveAttribute('value', baseEmail);
    rerender(<SelfEmailUpdate {...defaultProps} email="new@email.com" />);
    expect(screen.getByTestId('hidden-email-input')).toHaveAttribute('value', 'new@email.com');
  });

  it('handles directory-update-email event: same email triggers error and analytics', async () => {
    const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
    const triggerLoaderMock = jest.requireMock('@/utils/common.utils').triggerLoader;
    render(<SelfEmailUpdate {...defaultProps} />);
    await act(async () => {
      const event = new CustomEvent('directory-update-email', { detail: { newEmail: baseEmail } });
      document.dispatchEvent(event);
    });
    expect(toastError).toHaveBeenCalledWith('New and current email cannot be same');
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'app-loader-status' }));
    expect(onUpdateSameEmailProvidedMock).toHaveBeenCalledWith({ newEmail: baseEmail, oldEmail: baseEmail });
    expect(triggerLoaderMock).toHaveBeenCalledWith(false);
  });

  it('handles directory-update-email event: successful update', async () => {
    const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
    const reloadSpy = jest.spyOn(window.location, 'reload');
    render(<SelfEmailUpdate {...defaultProps} />);
    await act(async () => {
      const event = new CustomEvent('directory-update-email', { detail: { newEmail: 'new@site.com' } });
      document.dispatchEvent(event);
    });
    expect(toastSuccess).toHaveBeenCalledWith('Email Updated Successfully');
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app-loader-status' }));
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('handles directory-update-email event: update fails', async () => {
    const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
    const { updateUserDirectoryEmail } = require('@/services/members.service');
    updateUserDirectoryEmail.mockImplementationOnce(() => { throw new Error('fail'); });
    render(<SelfEmailUpdate {...defaultProps} />);
    await act(async () => {
      const event = new CustomEvent('directory-update-email', { detail: { newEmail: 'fail@site.com' } });
      document.dispatchEvent(event);
    });
    expect(toastError).toHaveBeenCalledWith('Email Update Failed');
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app-loader-status' }));
  });

  it('does nothing if directory-update-email event fires and no authToken (branch coverage)', async () => {
    cookies = {}; // No authToken
    render(<SelfEmailUpdate {...defaultProps} />);
    await act(async () => {
      const event = new CustomEvent('directory-update-email', { detail: { newEmail: 'something@site.com' } });
      document.dispatchEvent(event);
    });
    // Should not call success, error, or analytics
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
    expect(onUpdateSameEmailProvidedMock).not.toHaveBeenCalled();
  });

  it('handles directory-update-email event: update without tokens', async () => {
    const dispatchSpy = jest.spyOn(document, 'dispatchEvent');
    const { updateUserDirectoryEmail } = require('@/services/members.service');
    // Mock to return a result without refreshToken and accessToken
    updateUserDirectoryEmail.mockImplementationOnce(async () => ({
      userInfo: { id: 'user-1', email: 'no-token@site.com' },
    }));
    const triggerLoaderMock = jest.requireMock('@/utils/common.utils').triggerLoader;
    render(<SelfEmailUpdate {...defaultProps} />);
    await act(async () => {
      const event = new CustomEvent('directory-update-email', { detail: { newEmail: 'different@site.com' } });
      document.dispatchEvent(event);
    });
    // triggerLoader should be called but not the token-setting code
    expect(triggerLoaderMock).toHaveBeenCalledWith(false);
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('handles directory-update-email event: only one token present (refreshToken only)', async () => {
    const { updateUserDirectoryEmail } = require('@/services/members.service');
    updateUserDirectoryEmail.mockImplementationOnce(async () => ({
      refreshToken: 'refresh-token',
      userInfo: { id: 'user-1', email: 'no-access-token@site.com' },
    }));
    const triggerLoaderMock = jest.requireMock('@/utils/common.utils').triggerLoader;
    render(<SelfEmailUpdate email="a@b.com" uid="user-123" />);
    await act(async () => {
      const event = new CustomEvent('directory-update-email', { detail: { newEmail: 'unique@site.com' } });
      document.dispatchEvent(event);
    });
    expect(triggerLoaderMock).toHaveBeenCalledWith(false);
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('handles directory-update-email event: only one token present (accessToken only)', async () => {
    const { updateUserDirectoryEmail } = require('@/services/members.service');
    updateUserDirectoryEmail.mockImplementationOnce(async () => ({
      accessToken: 'access-token',
      userInfo: { id: 'user-1', email: 'no-refresh-token@site.com' },
    }));
    const triggerLoaderMock = jest.requireMock('@/utils/common.utils').triggerLoader;
    render(<SelfEmailUpdate email="a@b.com" uid="user-123" />);
    await act(async () => {
      const event = new CustomEvent('directory-update-email', { detail: { newEmail: 'unique2@site.com' } });
      document.dispatchEvent(event);
    });
    expect(triggerLoaderMock).toHaveBeenCalledWith(false);
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });
}); 