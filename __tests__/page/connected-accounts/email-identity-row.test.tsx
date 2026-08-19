import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { EmailIdentityRow } from '@/prototypes/entries/settings-contact-details/EmailIdentityRow';
import { authEvents } from '@/components/core/login/utils';
import { updateUserDirectoryEmail } from '@/services/members.service';
import { triggerLoader } from '@/utils/common.utils';
import { toast } from '@/components/core/ToastContainer';
import Cookies from 'js-cookie';
import type { IUserInfo } from '@/types/shared.types';

const mockCookies = Cookies as unknown as { get: jest.Mock; set: jest.Mock };

jest.mock('js-cookie', () => ({ __esModule: true, default: { get: jest.fn(), set: jest.fn() } }));

jest.mock('@/services/members.service', () => ({
  updateUserDirectoryEmail: jest.fn(),
}));

jest.mock('@/utils/common.utils', () => ({
  ...jest.requireActual('@/utils/common.utils'),
  triggerLoader: jest.fn(),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/utils/auth.utils', () => ({
  decodeToken: () => ({ exp: 2_000_000_000 }),
}));

jest.mock('@/analytics/auth.analytics', () => ({
  useAuthAnalytics: () => ({
    onUpdateEmailClicked: jest.fn(),
    onUpdateEmailSuccess: jest.fn(),
    onUpdateEmailFailure: jest.fn(),
    onUpdateSameEmailProvided: jest.fn(),
  }),
}));

const userInfo = { uid: 'member-1', email: 'old@plrs.xyz', name: 'John Doe' } as IUserInfo;

function renderRow() {
  return render(<EmailIdentityRow uid="member-1" email="old@plrs.xyz" userInfo={userInfo} />);
}

/** Privy answers a completed OTP flow with this event; the row does the directory update. */
function emitPrivyResult(newEmail: string) {
  return act(async () => {
    authEvents.emit('auth:update-email', { newEmail });
  });
}

describe('EmailIdentityRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.get.mockReturnValue(JSON.stringify('token'));
  });

  it('presents the address as identity, not as an editable contact field', () => {
    renderRow();

    expect(screen.getByLabelText('Email address')).toHaveTextContent('old@plrs.xyz');
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText(/You sign in with this address/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Continue$/ })).not.toBeInTheDocument();
  });

  it('states the consequence before handing over to the code flow', () => {
    renderRow();

    fireEvent.click(screen.getByRole('button', { name: 'Change email address' }));

    expect(screen.getByText(/send it a 6-digit code/)).toBeInTheDocument();
    expect(screen.getByText(/current address keeps working/)).toBeInTheDocument();
  });

  it('asks Privy to run the update-email flow on Continue', () => {
    const linkAccount = jest.fn();
    const unsubscribe = authEvents.on('auth:link-account', linkAccount);
    renderRow();

    fireEvent.click(screen.getByRole('button', { name: 'Change email address' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(linkAccount).toHaveBeenCalledWith('updateEmail');
    unsubscribe();
  });

  it('names the cause when the new address is the current one, and calls nothing', async () => {
    renderRow();

    await emitPrivyResult('old@plrs.xyz');

    expect(updateUserDirectoryEmail).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('That’s already your email address');
    // Privy raised the app loader before handing back; a refused change has to lower it.
    expect(triggerLoader).toHaveBeenCalledWith(false);
  });

  it('surfaces the reason the directory refused the address', async () => {
    (updateUserDirectoryEmail as jest.Mock).mockResolvedValue({
      isError: true,
      status: 400,
      message: 'Email already in use',
    });
    renderRow();

    await emitPrivyResult('taken@plrs.xyz');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already in use');
    expect(triggerLoader).toHaveBeenCalledWith(false);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('reissues the auth cookies when the change goes through', async () => {
    const reload = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });
    (updateUserDirectoryEmail as jest.Mock).mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      userInfo: { uid: 'member-1', email: 'new@plrs.xyz' },
    });
    renderRow();

    await emitPrivyResult('new@plrs.xyz');

    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(mockCookies.set).toHaveBeenCalledWith('authToken', JSON.stringify('new-access'), expect.anything());
    expect(mockCookies.set).toHaveBeenCalledWith('refreshToken', JSON.stringify('new-refresh'), expect.anything());
    expect(mockCookies.set).toHaveBeenCalledWith(
      'userInfo',
      JSON.stringify({ uid: 'member-1', email: 'new@plrs.xyz' }),
      expect.anything(),
    );
    expect(toast.success).toHaveBeenCalledWith('Email Updated Successfully');
  });
});
