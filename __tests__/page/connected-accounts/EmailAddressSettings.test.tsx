import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cookies from 'js-cookie';

import { EmailAddressSettings } from '@/components/page/connected-accounts/components/EmailAddressSettings';
import { authEvents } from '@/components/core/login/utils';
import { toast } from '@/components/core/ToastContainer';
import { updateUserDirectoryEmail } from '@/services/members.service';
import { useAuthAnalytics } from '@/analytics/auth.analytics';

jest.mock('js-cookie');
jest.mock('@/services/members.service');
jest.mock('@/analytics/auth.analytics');
jest.mock('@/utils/auth.utils', () => ({
  decodeToken: jest.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 3600 })),
}));
jest.mock('@/components/core/ToastContainer', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// jsdom doesn't implement navigation; the success path calls window.location.reload().
Object.defineProperty(window, 'location', {
  writable: true,
  value: { ...window.location, reload: jest.fn() },
});

const userInfo = {
  uid: 'member-1',
  email: 'current@example.com',
  name: 'Jane Doe',
  roles: [],
};

describe('EmailAddressSettings', () => {
  let analyticsMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsMock = {
      onUpdateEmailClicked: jest.fn(),
      onUpdateEmailSuccess: jest.fn(),
      onUpdateEmailFailure: jest.fn(),
      onUpdateSameEmailProvided: jest.fn(),
    };
    (useAuthAnalytics as jest.Mock).mockReturnValue(analyticsMock);
    (Cookies.get as jest.Mock).mockReturnValue(JSON.stringify('token'));
    (Cookies.set as jest.Mock) = jest.fn();
  });

  it('shows the current email and a clearly labeled Edit action', () => {
    render(<EmailAddressSettings userInfo={userInfo} />);

    expect(screen.getByText(userInfo.email)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('starts the Privy update-email flow when Edit is clicked', () => {
    const emitSpy = jest.spyOn(authEvents, 'emit');

    render(<EmailAddressSettings userInfo={userInfo} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(analyticsMock.onUpdateEmailClicked).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('auth:link-account', 'updateEmail');
  });

  it('rejects re-submitting the same email without calling the update API', async () => {
    render(<EmailAddressSettings userInfo={userInfo} />);

    authEvents.emit('auth:update-email', { newEmail: userInfo.email });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('New and current email cannot be same');
    });
    expect(updateUserDirectoryEmail).not.toHaveBeenCalled();
  });

  it('persists a new email and shows a success toast once Privy confirms the change', async () => {
    (updateUserDirectoryEmail as jest.Mock).mockResolvedValue({
      refreshToken: 'refresh-token',
      accessToken: 'access-token',
      userInfo: { ...userInfo, email: 'new@example.com' },
    });

    render(<EmailAddressSettings userInfo={userInfo} />);

    authEvents.emit('auth:update-email', { newEmail: 'new@example.com' });

    await waitFor(() => {
      expect(updateUserDirectoryEmail).toHaveBeenCalledWith(
        { newEmail: 'new@example.com' },
        userInfo.uid,
        expect.objectContaining({ Authorization: expect.any(String) }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Email Updated Successfully');
  });
});
