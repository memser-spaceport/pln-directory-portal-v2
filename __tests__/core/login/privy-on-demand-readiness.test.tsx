/**
 * LAB-3092: Privy loads when it is needed, so it may not be ready when its handlers mount. A request that waited for it
 * is delivered only once it is ready, and a sign-in starts only once it is ready.
 */
import { act, render } from '@testing-library/react';

const privy = {
  ready: false,
  logout: jest.fn(async () => {}),
  login: jest.fn(),
};
jest.mock('@/components/core/login/hooks/usePrivyWrapper', () => ({
  __esModule: true,
  default: () => ({
    ready: privy.ready,
    logout: privy.logout,
    login: privy.login,
    getAccessToken: jest.fn(),
    linkEmail: jest.fn(),
    linkGithub: jest.fn(),
    linkGoogle: jest.fn(),
    linkWallet: jest.fn(),
    unlinkEmail: jest.fn(),
    updateEmail: jest.fn(),
    user: null,
  }),
}));
jest.mock('@/components/core/login/hooks/useAuthTokens', () => ({
  useAuthTokens: () => ({ saveTokens: jest.fn() }),
  getLinkedAccounts: jest.fn(() => ''),
}));
jest.mock('@/analytics/auth.analytics', () => ({
  useAuthAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
jest.mock('@/components/core/login/components/modals/LinkAccountModal', () => ({ LinkAccountModal: () => null }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/home',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));
const mockCreateStateUid = jest.fn(async () => ({ ok: true, data: 'state-1' }));
jest.mock('@/services/auth.service', () => ({
  createStateUid: () => mockCreateStateUid(),
  deletePrivyUser: jest.fn(),
  exchangeToken: jest.fn(),
}));

import { PrivyModals } from '@/components/core/login/components/PrivyModals';
import { AuthInfo } from '@/components/core/login/components/AuthInfo';
import { authEvents, privyDemand } from '@/components/core/login/utils';

const flush = () => act(async () => {});

beforeEach(() => {
  privy.ready = false;
  privy.logout.mockClear();
  privy.login.mockClear();
  mockCreateStateUid.mockClear();
  authEvents.clear();
  privyDemand.reset();
});

describe('PrivyModals replays requests that waited for Privy', () => {
  it('delivers a queued sign-out only once Privy is ready, and once', async () => {
    authEvents.emit('auth:logout');
    const { rerender } = render(<PrivyModals />);
    await flush();
    expect(privy.logout).not.toHaveBeenCalled();

    privy.ready = true;
    rerender(<PrivyModals />);
    await flush();
    expect(privy.logout).toHaveBeenCalledTimes(1);

    rerender(<PrivyModals />);
    await flush();
    expect(privy.logout).toHaveBeenCalledTimes(1);
  });
});

describe('AuthInfo starts a sign-in only once Privy is ready', () => {
  it('does nothing while Privy loads, then runs its sequence once', async () => {
    const { rerender } = render(<AuthInfo />);
    await flush();
    expect(privy.logout).not.toHaveBeenCalled();
    expect(mockCreateStateUid).not.toHaveBeenCalled();

    privy.ready = true;
    rerender(<AuthInfo />);
    await flush();
    expect(privy.logout).toHaveBeenCalledTimes(1);
    expect(mockCreateStateUid).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('stateUid')).toBe('state-1');

    rerender(<AuthInfo />);
    await flush();
    expect(mockCreateStateUid).toHaveBeenCalledTimes(1);
  });
});
