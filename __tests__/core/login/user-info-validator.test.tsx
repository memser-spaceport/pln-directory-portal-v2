import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Cookies from 'js-cookie';

import { UserInfoValidator } from '@/components/core/login/components/UserInfoValidator/UserInfoValidator';
import { refreshSession } from '@/services/session.service';
import { clearAllAuthCookies, hasSession } from '@/utils/third-party.helper';

const refresh = jest.fn();
const replace = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh, replace }) }));
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ reset: jest.fn() }) }));
jest.mock('js-cookie', () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/services/session.service', () => ({ refreshSession: jest.fn() }));
jest.mock('@/utils/third-party.helper', () => ({ clearAllAuthCookies: jest.fn(), hasSession: jest.fn() }));
jest.mock('@/components/core/login/utils', () => ({ authEvents: { emit: jest.fn() } }));
jest.mock('@/components/core/login/components/BroadcastChannel', () => ({ broadcastLogout: jest.fn() }));
jest.mock('@/components/core/login/components/modals/SessionExpiredModal', () => ({
  SessionExpiredModal: ({ open }: { open: boolean }) => (open ? <div>Session Expired</div> : null),
}));

const mockedRefresh = refreshSession as jest.Mock;
const mockedHasSession = hasSession as jest.Mock;
const mockedClear = clearAllAuthCookies as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (Cookies.get as jest.Mock).mockReturnValue(undefined);
  mockedClear.mockResolvedValue(undefined);
});

describe('UserInfoValidator with an httpOnly refresh token', () => {
  it('restores missing userInfo through the server refresh without signing out', async () => {
    mockedHasSession.mockReturnValue(true);
    mockedRefresh.mockResolvedValue({ accessToken: 'a', userInfo: { uid: 'm-1' } });

    render(<UserInfoValidator userInfo={null} isLoggedIn authToken="a" />);

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(mockedClear).not.toHaveBeenCalled();
    expect(screen.queryByText('Session Expired')).not.toBeInTheDocument();
  });

  it('shows Session Expired and signs out when the session cannot be renewed', async () => {
    mockedHasSession.mockReturnValue(true);
    mockedRefresh.mockResolvedValue(null);

    render(<UserInfoValidator userInfo={null} isLoggedIn authToken="a" />);

    expect(await screen.findByText('Session Expired')).toBeInTheDocument();
    expect(mockedClear).toHaveBeenCalled();
  });

  it('does not try to refresh when there is no session marker', async () => {
    mockedHasSession.mockReturnValue(false);

    render(<UserInfoValidator userInfo={null} isLoggedIn={false} authToken={null} />);

    expect(mockedRefresh).not.toHaveBeenCalled();
  });
});
