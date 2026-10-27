import { publicRequestLocation, sessionCookieFlags } from '@/utils/sessionCookies';

describe('sessionCookieFlags', () => {
  it.each([
    ['https://os.pl.xyz', true],
    ['https://directoryv2.dev.os.pl.xyz', true],
    // TLS ends at the load balancer: a deployed host seen as http: still gets Secure.
    ['http://os.pl.xyz', true],
    ['http://localhost:4200', false],
    ['http://127.0.0.1:4200', false],
    ['https://localhost:4200', true],
  ])('%s → Secure=%s, SameSite=Lax', (url, secure) => {
    const { protocol, hostname } = new URL(url);
    expect(sessionCookieFlags({ protocol, hostname })).toEqual({ sameSite: 'lax', secure });
  });
});

describe('publicRequestLocation', () => {
  const req = (url: string, headers: Record<string, string>) => ({
    headers: new Headers(headers),
    nextUrl: new URL(url),
  });

  it('uses the Host header and X-Forwarded-Proto behind the ingress, not the pod address', () => {
    expect(
      publicRequestLocation(
        req('http://localhost:4200/api/auth/session', { host: 'os.pl.xyz', 'x-forwarded-proto': 'https' }),
      ),
    ).toEqual({ host: 'os.pl.xyz', hostname: 'os.pl.xyz', protocol: 'https:' });
  });

  it('prefers X-Forwarded-Host, first value only', () => {
    expect(
      publicRequestLocation(
        req('http://localhost:4200/', {
          host: 'internal',
          'x-forwarded-host': 'os.pl.xyz, other',
          'x-forwarded-proto': 'https,http',
        }),
      ),
    ).toEqual({ host: 'os.pl.xyz', hostname: 'os.pl.xyz', protocol: 'https:' });
  });

  it('local dev: Host localhost:4200 over http stays insecure', () => {
    const location = publicRequestLocation(req('http://localhost:4200/', { host: 'localhost:4200' }));
    expect(location).toEqual({ host: 'localhost:4200', hostname: 'localhost', protocol: 'http:' });
    expect(sessionCookieFlags(location).secure).toBe(false);
  });
});
