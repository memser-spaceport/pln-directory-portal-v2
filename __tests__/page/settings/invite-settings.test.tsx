import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import InviteSettingsPage from '@/app/settings/invite/page';
import { COPIED_MS } from '@/components/page/settings/invite/InviteLinkCard';
import { InviteSettings } from '@/components/page/settings/invite/InviteSettings';
import { getMyInviteLink, MY_INVITE_LINK_PATH, parseInviteLink } from '@/services/members/invite-link.service';
import type { IUserInfo } from '@/types/shared.types';

// LAB-3398 R3, R5, R9, R10. Contract (LAB-3396): signed-in GET /v1/members/me/invite-link → { inviteCode, inviteUrl }.

const mockRedirect = jest.fn((_url: string) => {
  throw new Error('NEXT_REDIRECT');
});
jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/settings/invite',
}));
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: async () => ({ isLoggedIn: false }) }));
jest.mock('@/utils/common.utils', () => ({ triggerLoader: jest.fn() }));
const mockFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: (...args: unknown[]) => mockFetch(...args) }));
const mockQuery = jest.fn();
jest.mock('@/services/members/hooks/useMyInviteLink', () => ({ useMyInviteLink: (uid?: string) => mockQuery(uid) }));

const LINK = { inviteCode: 'ab 1', inviteUrl: 'https://labos.example/sign-up?invite=ab%201&utm_source=invite' };
const refetch = jest.fn();
const query = (state: object) => mockQuery.mockReturnValue({ data: undefined, isError: false, refetch, ...state });
const renderTab = () => render(<InviteSettings userInfo={{ uid: 'm1' } as IUserInfo} />);
const setClipboard = (writeText?: jest.Mock) =>
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: writeText && { writeText } });

beforeEach(() => jest.clearAllMocks());

describe('invite link service', () => {
  it('reads the agreed path with the session and returns inviteUrl as it is', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => LINK });
    await expect(getMyInviteLink()).resolves.toEqual(LINK);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/members\/me\/invite-link$/),
      { method: 'GET' },
      true,
    );
    expect(MY_INVITE_LINK_PATH).toBe('/v1/members/me/invite-link');
  });

  it.each([undefined, { ok: false, status: 500 }])('throws on a failed response (%p)', async (response) => {
    mockFetch.mockResolvedValue(response);
    await expect(getMyInviteLink()).rejects.toThrow('Failed to fetch the invite link');
  });

  it.each([
    null,
    { inviteUrl: LINK.inviteUrl },
    { inviteCode: 'a', inviteUrl: '/sign-up' },
    { inviteCode: 'a', inviteUrl: 'javascript:x' },
  ])('rejects an invalid body %p', (body) => expect(() => parseInviteLink(body)).toThrow());
});

describe('Settings → Invite', () => {
  it('sends a signed-out visitor to sign-in with a fixed returnTo', async () => {
    await expect(InviteSettingsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/home?returnTo=settings-invite#login');
  });

  it.each([
    ['while it loads', {}],
    ['when the request fails', { isError: true }],
  ])('shows no link %s', (_label, state) => {
    query(state);
    renderTab();
    expect(screen.queryByRole('textbox', { name: 'Your invite link' })).not.toBeInTheDocument();
  });

  it('offers Try again after an error', () => {
    query({ isError: true });
    renderTab();
    expect(screen.getByRole('alert')).toHaveTextContent('We cannot show your invite link now.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the API URL as it is, copies it, and shows "Copied" in place for 2 s', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    query({ data: LINK });
    renderTab();
    expect(mockQuery).toHaveBeenCalledWith('m1');
    expect(screen.getByRole('textbox', { name: 'Your invite link' })).toHaveValue(LINK.inviteUrl);

    jest.useFakeTimers();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' })));
    expect(writeText).toHaveBeenCalledWith(LINK.inviteUrl);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(COPIED_MS));
    expect(screen.getByRole('button', { name: 'Copy invite link' })).toBeInTheDocument();
    jest.useRealTimers();
  });

  it.each([
    ['blocks the write', jest.fn().mockRejectedValue(new Error('NotAllowedError'))],
    ['has no clipboard', undefined],
  ])('keeps the link visible and selectable when the browser %s', async (_label, writeText) => {
    setClipboard(writeText);
    query({ data: LINK });
    renderTab();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' })));
    expect(screen.getByRole('status')).toHaveTextContent('The link did not copy.');
    expect(screen.getByRole('textbox', { name: 'Your invite link' })).toHaveValue(LINK.inviteUrl);
  });
});
