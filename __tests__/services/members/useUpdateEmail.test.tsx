import { act, renderHook, waitFor } from '@testing-library/react';

import { useUpdateEmail } from '@/services/members/hooks/useUpdateEmail';
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

const onUpdateEmailClicked = jest.fn();
const onUpdateEmailSuccess = jest.fn();
const onUpdateEmailFailure = jest.fn();
const onUpdateSameEmailProvided = jest.fn();

jest.mock('@/analytics/auth.analytics', () => ({
  useAuthAnalytics: () => ({
    onUpdateEmailClicked,
    onUpdateEmailSuccess,
    onUpdateEmailFailure,
    onUpdateSameEmailProvided,
  }),
}));

const userInfo = { uid: 'member-1', email: 'old@plrs.xyz', name: 'John Doe' } as IUserInfo;

function renderUpdateEmail(onFailure?: jest.Mock, source?: 'email-and-accounts' | 'member-profile') {
  return renderHook(() => useUpdateEmail({ uid: 'member-1', email: 'old@plrs.xyz', userInfo, onFailure, source }));
}

/** Privy answers a completed OTP flow with this event; the hook does the directory update. */
function emitPrivyResult(newEmail: string) {
  return act(async () => {
    authEvents.emit('auth:update-email', { newEmail });
  });
}

describe('useUpdateEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.get.mockReturnValue(JSON.stringify('token'));
  });

  describe('requestEmailChange', () => {
    it('asks Privy to run the update-email flow', () => {
      const linkAccount = jest.fn();
      const unsubscribe = authEvents.on('auth:link-account', linkAccount);
      const { result } = renderUpdateEmail();

      act(() => result.current.requestEmailChange());

      expect(linkAccount).toHaveBeenCalledWith('updateEmail');
      expect(onUpdateEmailClicked).toHaveBeenCalled();
      unsubscribe();
    });

    it('stamps which surface started the change', () => {
      const { result } = renderUpdateEmail(undefined, 'email-and-accounts');

      act(() => result.current.requestEmailChange());

      expect(onUpdateEmailClicked.mock.calls[0][1]).toBe('email-and-accounts');
    });

    it('does not start the flow without a session — completing it would change a real Privy email', () => {
      mockCookies.get.mockReturnValue(undefined);
      const linkAccount = jest.fn();
      const unsubscribe = authEvents.on('auth:link-account', linkAccount);
      const { result } = renderUpdateEmail();

      act(() => result.current.requestEmailChange());

      expect(linkAccount).not.toHaveBeenCalled();
      unsubscribe();
    });
  });

  describe('when Privy hands back a new address', () => {
    it('refuses the address already on record, and calls nothing', async () => {
      const onFailure = jest.fn();
      renderUpdateEmail(onFailure);

      await emitPrivyResult('old@plrs.xyz');

      expect(updateUserDirectoryEmail).not.toHaveBeenCalled();
      expect(onUpdateSameEmailProvided).toHaveBeenCalledWith(
        { newEmail: 'old@plrs.xyz', oldEmail: 'old@plrs.xyz' },
        undefined,
      );
      expect(onFailure).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'same-email', message: expect.stringContaining('already your email') }),
      );
      // Privy raised the app loader before handing back; a refused change has to lower it.
      expect(triggerLoader).toHaveBeenCalledWith(false);
    });

    it('reports the reason the directory refused the address', async () => {
      (updateUserDirectoryEmail as jest.Mock).mockResolvedValue({
        isError: true,
        status: 400,
        message: 'Email already in use',
      });
      const onFailure = jest.fn();
      renderUpdateEmail(onFailure);

      await emitPrivyResult('taken@plrs.xyz');

      await waitFor(() =>
        expect(onFailure).toHaveBeenCalledWith(
          expect.objectContaining({ reason: 'rejected', message: expect.stringContaining('Email already in use') }),
        ),
      );
      expect(onUpdateEmailFailure).toHaveBeenCalled();
      expect(triggerLoader).toHaveBeenCalledWith(false);
      expect(toast.success).not.toHaveBeenCalled();
    });

    // A rejection answers without tokens; the caller that skipped `isError` showed nothing at all.
    it('reports a refusal that arrives without a message rather than falling silent', async () => {
      (updateUserDirectoryEmail as jest.Mock).mockResolvedValue({ isError: true, status: 500 });
      const onFailure = jest.fn();
      renderUpdateEmail(onFailure);

      await emitPrivyResult('new@plrs.xyz');

      await waitFor(() => expect(onFailure).toHaveBeenCalledWith(expect.objectContaining({ reason: 'rejected' })));
    });

    it('reports a request that threw', async () => {
      (updateUserDirectoryEmail as jest.Mock).mockRejectedValue(new Error('offline'));
      const onFailure = jest.fn();
      renderUpdateEmail(onFailure);

      await emitPrivyResult('new@plrs.xyz');

      await waitFor(() => expect(onFailure).toHaveBeenCalledWith(expect.objectContaining({ reason: 'unexpected' })));
      expect(onUpdateEmailFailure).toHaveBeenCalled();
      expect(triggerLoader).toHaveBeenCalledWith(false);
    });

    it('falls back to a toast when the caller has nowhere to render the failure', async () => {
      (updateUserDirectoryEmail as jest.Mock).mockResolvedValue({ isError: true, message: 'Email already in use' });
      renderUpdateEmail();

      await emitPrivyResult('taken@plrs.xyz');

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Email already in use')));
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
      renderUpdateEmail();

      await emitPrivyResult('new@plrs.xyz');

      await waitFor(() => expect(reload).toHaveBeenCalled());
      expect(mockCookies.set).toHaveBeenCalledWith('authToken', JSON.stringify('new-access'), expect.anything());
      expect(mockCookies.set).toHaveBeenCalledWith('refreshToken', JSON.stringify('new-refresh'), expect.anything());
      expect(mockCookies.set).toHaveBeenCalledWith(
        'userInfo',
        JSON.stringify({ uid: 'member-1', email: 'new@plrs.xyz' }),
        expect.anything(),
      );
      expect(onUpdateEmailSuccess).toHaveBeenCalledWith(
        { newEmail: 'new@plrs.xyz', oldEmail: 'old@plrs.xyz' },
        undefined,
      );
      expect(toast.success).toHaveBeenCalledWith('Email Updated Successfully');
    });
  });

  it('stops listening once unmounted, so a stale row cannot answer for the current one', async () => {
    const { unmount } = renderUpdateEmail();

    unmount();
    await emitPrivyResult('new@plrs.xyz');

    expect(updateUserDirectoryEmail).not.toHaveBeenCalled();
  });
});
