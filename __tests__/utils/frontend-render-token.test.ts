/**
 * @jest-environment node
 */
/**
 * LAB-3086: the server's reads of the directory API carry the render token, so the API's rate limit lets them
 * through. Nothing else gets it: not other hosts, not writes, not a server with no token configured.
 */
import {
  FRONTEND_RENDER_HEADER,
  installFrontendRenderToken,
  withFrontendRenderToken,
} from '@/utils/frontend-render-token';

const config = { apiBase: 'https://api.example/', token: 'render-token' };
const tokenOf = (args: [RequestInfo | URL, RequestInit?]) => new Headers(args[1]?.headers).get(FRONTEND_RENDER_HEADER);

describe('withFrontendRenderToken', () => {
  it('adds the token to a read of the API, keeping the other headers', () => {
    const args = withFrontendRenderToken(
      ['https://api.example/v1/teams/abc?with=logo', { headers: { Authorization: 'Bearer t' }, cache: 'no-store' }],
      config,
    );

    expect(tokenOf(args)).toBe('render-token');
    expect(new Headers(args[1]?.headers).get('Authorization')).toBe('Bearer t');
    expect(args[1]?.cache).toBe('no-store');
  });

  it('accepts a URL object and a Request', () => {
    expect(tokenOf(withFrontendRenderToken([new URL('https://api.example/v1/teams')], config))).toBe('render-token');

    const request = new Request('https://api.example/v1/teams', { headers: { Accept: 'application/json' } });
    const args = withFrontendRenderToken([request], config);
    expect(tokenOf(args)).toBe('render-token');
    expect(new Headers(args[1]?.headers).get('Accept')).toBe('application/json');
  });

  it('leaves writes alone', () => {
    const args: [string, RequestInit] = ['https://api.example/v1/teams', { method: 'POST', body: '{}' }];
    expect(withFrontendRenderToken(args, config)).toBe(args);
    expect(
      withFrontendRenderToken([new Request('https://api.example/v1/x', { method: 'PUT' })], config)[1],
    ).toBeUndefined();
  });

  it('never sends the token to another host', () => {
    for (const url of [
      'https://other.example/v1/teams',
      'https://api.example.evil.com/v1/teams',
      'http://api.example/v1/teams',
    ]) {
      expect(tokenOf(withFrontendRenderToken([url], config))).toBeNull();
    }
  });

  it('does nothing without a token or an API address', () => {
    expect(tokenOf(withFrontendRenderToken(['https://api.example/v1/teams'], { ...config, token: '' }))).toBeNull();
    expect(
      tokenOf(withFrontendRenderToken(['https://api.example/v1/teams'], { ...config, apiBase: undefined })),
    ).toBeNull();
  });
});

describe('installFrontendRenderToken', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('wraps fetch once, reading the env at call time', async () => {
    const calls: [RequestInfo | URL, RequestInit?][] = [];
    const target = {
      fetch: jest.fn(async (...args: [RequestInfo | URL, RequestInit?]) => {
        calls.push(args);
        return new Response('{}');
      }),
    } as unknown as typeof globalThis;

    installFrontendRenderToken(target);
    installFrontendRenderToken(target);
    process.env.DIRECTORY_API_URL = 'https://api.example';
    process.env.FRONTEND_RENDER_THROTTLE_TOKEN = 'render-token';
    await target.fetch('https://api.example/v1/members/m1');

    expect(calls).toHaveLength(1);
    expect(tokenOf(calls[0])).toBe('render-token');
  });
});
