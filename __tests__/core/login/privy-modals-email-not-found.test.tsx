/**
 * LAB-3127: when the directory has no member for the email someone signed in with, PrivyModals tells the error dialog
 * which email it was, before Privy's logout clears the user.
 */
import { act, render } from '@testing-library/react';

const calls: string[] = [];
const privy = {
  user: null as unknown,
  logout: jest.fn(async () => {
    calls.push('logout');
  }),
};
jest.mock('@/components/core/login/hooks/usePrivyWrapper', () => ({
  __esModule: true,
  default: () => ({
    ready: true,
    logout: privy.logout,
    login: jest.fn(),
    getAccessToken: jest.fn(async () => 'privy-token'),
    linkEmail: jest.fn(),
    linkGithub: jest.fn(),
    linkGoogle: jest.fn(),
    linkWallet: jest.fn(),
    unlinkEmail: jest.fn(),
    updateEmail: jest.fn(),
    user: privy.user,
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
const mockExchangeToken = jest.fn();
jest.mock('@/services/auth.service', () => ({
  createStateUid: jest.fn(),
  deletePrivyUser: jest.fn(),
  exchangeToken: (...args: unknown[]) => mockExchangeToken(...args),
}));

import { PrivyModals } from '@/components/core/login/components/PrivyModals';
import { authEvents } from '@/components/core/login/utils';
import type { InvalidEmailPayload } from '@/components/core/login/utils';

const flush = () => act(async () => {});

async function signInAndGet404(eventUser: unknown) {
  const payloads: InvalidEmailPayload[] = [];
  authEvents.on('auth:invalid-email', (payload) => {
    calls.push('invalid-email');
    payloads.push(payload);
  });

  render(<PrivyModals />);
  await flush();

  await act(async () => {
    authEvents.emit('auth:login-success', { user: eventUser });
  });
  await flush();

  return payloads;
}

beforeEach(() => {
  calls.length = 0;
  privy.user = null;
  privy.logout.mockClear();
  mockExchangeToken.mockReset();
  mockExchangeToken.mockResolvedValue({ ok: false, data: null, status: 404 });
  authEvents.clear();
  localStorage.clear();
  localStorage.setItem('stateUid', 'state-1');
});

describe('PrivyModals: email not found', () => {
  it('sends the code with the signed-in email, then logs out', async () => {
    const user = { id: 'did:privy:1', email: { address: 'new.person@example.com' }, linkedAccounts: [] };
    privy.user = user;

    const payloads = await signInAndGet404(user);

    expect(payloads).toEqual([{ code: 'email_not_found', email: 'new.person@example.com' }]);
    expect(calls).toEqual(['invalid-email', 'logout']);
  });

  it("uses the event's user when the hook has not caught up yet", async () => {
    const payloads = await signInAndGet404({ id: 'did:privy:2', email: { address: 'fresh@example.com' } });

    expect(payloads).toEqual([{ code: 'email_not_found', email: 'fresh@example.com' }]);
  });

  it('falls back to the Google account email', async () => {
    const payloads = await signInAndGet404({ id: 'did:privy:3', google: { email: 'g.person@example.com' } });

    expect(payloads).toEqual([{ code: 'email_not_found', email: 'g.person@example.com' }]);
  });

  it('sends no email when the Privy user has none', async () => {
    const payloads = await signInAndGet404({ id: 'did:privy:4', wallet: { address: '0xabc' } });

    expect(payloads).toEqual([{ code: 'email_not_found', email: undefined }]);
    expect(calls).toEqual(['invalid-email', 'logout']);
  });

  it('keeps sending the bare code for other failures', async () => {
    mockExchangeToken.mockResolvedValue({ ok: false, data: null, status: 403 });

    const payloads = await signInAndGet404({ id: 'did:privy:5', email: { address: 'x@example.com' } });

    expect(payloads).toEqual(['rejected_access_level']);
  });
});
