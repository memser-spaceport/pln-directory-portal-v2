/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

const cookieJar: Record<string, string> = {};
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (cookieJar[name] ? { value: cookieJar[name] } : undefined) }),
}));

import { GET } from '@/app/pl-infra/ai-apps/authorize/route';

const ORIGIN = 'https://directoryv2.dev.os.pl.xyz';
const STATE = 'A'.repeat(43);
const fetchMock = jest.fn();

function call(query: Record<string, string>) {
  const qs = new URLSearchParams(query).toString();
  return GET(new NextRequest(`${ORIGIN}/pl-infra/ai-apps/authorize?${qs}`));
}
const location = (res: Response) => new URL(res.headers.get('location') as string);

beforeEach(() => {
  process.env.DIRECTORY_API_URL = 'https://api.test';
  process.env.COOKIE_DOMAIN = '.dev.os.pl.xyz';
  cookieJar.authToken = '"labos.jwt.token"';
  fetchMock.mockReset().mockResolvedValue(
    new Response(JSON.stringify({ code: 'one-time-code', callbackOrigin: 'https://foo-dev.dev.os.pl.xyz' }), {
      status: 201,
    }),
  );
  (global as any).fetch = fetchMock;
});

describe('GET /pl-infra/ai-apps/authorize', () => {
  it('mints a code with the LabOS token and sends the member to the app callback', async () => {
    const res = await call({ appId: 'foo', target: 'dev', state: STATE, return: '/reports?x=1' });
    const loc = location(res);

    expect(res.status).toBe(307);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(`${loc.origin}${loc.pathname}`).toBe('https://foo-dev.dev.os.pl.xyz/_pln/callback');
    expect(Object.fromEntries(loc.searchParams)).toEqual({
      code: 'one-time-code',
      state: STATE,
      return: '/reports?x=1',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/v1/ai-apps/sessions/code',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer labos.jwt.token' }),
        body: JSON.stringify({ appId: 'foo', target: 'dev' }),
      }),
    );
  });

  it.each(['https://evil.com/x', '//evil.com', '/\\evil.com', 'javascript:alert(1)'])(
    'returns to / for an unsafe return (%s)',
    async (ret) => {
      const res = await call({ appId: 'foo', state: STATE, return: ret });
      expect(location(res).searchParams.get('return')).toBe('/');
    },
  );

  it.each([
    ['a malformed appId', { appId: 'Foo/../x', state: STATE }],
    ['a malformed state', { appId: 'foo', state: 'short' }],
    ['an unknown target', { appId: 'foo', target: 'staging', state: STATE }],
  ])('lands on the AI Apps page for %s, without calling the API', async (_label, query) => {
    const res = await call(query as Record<string, string>);
    expect(location(res).pathname).toBe('/pl-infra/ai-apps');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'the API refuses (e.g. no AI Apps access)',
      () => fetchMock.mockResolvedValue(new Response('{}', { status: 403 })),
    ],
    ['the API is unreachable', () => fetchMock.mockRejectedValue(new Error('down'))],
    [
      'the callback origin is not an app host',
      () =>
        fetchMock.mockResolvedValue(
          new Response(JSON.stringify({ code: 'c', callbackOrigin: 'https://evil.example' }), { status: 201 }),
        ),
    ],
  ])('never loops back to the app when %s', async (_label, arrange) => {
    arrange();
    const res = await call({ appId: 'foo', state: STATE });
    expect(location(res).pathname).toBe('/pl-infra/ai-apps');
  });

  it('sends a member without a LabOS token to login and back here', async () => {
    delete cookieJar.authToken;
    const res = await call({ appId: 'foo', state: STATE, return: '/r' });
    const loc = location(res);
    expect(loc.pathname).toBe('/members');
    expect(decodeURIComponent(loc.searchParams.get('backlink') as string)).toContain(
      '/pl-infra/ai-apps/authorize?appId=foo',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
