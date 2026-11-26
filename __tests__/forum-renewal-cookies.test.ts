/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

import { renewAccessToken } from '@/services/auth.service';
import { proxyForumRequest } from '@/services/forum/forum-nodebb.server';
import { decodeToken } from '@/utils/auth.utils';

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('@/services/auth.service', () => ({ renewAccessToken: jest.fn() }));
jest.mock('@/utils/auth.utils', () => ({
  calculateExpiry: (tokenExpiry: number) => tokenExpiry - Date.now() / 1000,
  decodeToken: jest.fn(),
}));

const { cookies } = jest.requireMock('next/headers') as { cookies: jest.Mock };
const mockedRenew = renewAccessToken as jest.Mock;
const mockedDecode = decodeToken as jest.Mock;

function renewWith(exp?: number) {
  mockedRenew.mockResolvedValue({
    ok: true,
    data: { accessToken: 'acc', refreshToken: 'ref', userInfo: { uid: 'u1' } },
  });
  mockedDecode.mockReturnValue(exp === undefined ? {} : { exp });
}

async function renewalResponse() {
  cookies.mockResolvedValue({ get: (n: string) => (n === 'refreshToken' ? { value: '"old"' } : undefined) });
  jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
  process.env.FORUM_API_URL = 'https://forum.example.com';
  return proxyForumRequest(new NextRequest('https://os.example.com/api/forum/nodebb/api/topic/1'), [
    'api',
    'topic',
    '1',
  ]);
}

const refreshCookie = (res: Response) => res.headers.getSetCookie().find((c) => c.startsWith('refreshToken='));

describe('forum session renewal cookies', () => {
  afterEach(() => jest.restoreAllMocks());

  it('writes refreshToken HttpOnly, Secure and SameSite=Lax', async () => {
    renewWith(Math.floor(Date.now() / 1000) + 3600);
    const set = refreshCookie(await renewalResponse());
    expect(set).toMatch(/HttpOnly/i);
    expect(set).toMatch(/Secure/i);
    expect(set).toMatch(/SameSite=Lax/i);
  });

  it('sets no cookies when a token has no exp', async () => {
    renewWith();
    expect((await renewalResponse()).headers.getSetCookie()).toEqual([]);
  });
});
