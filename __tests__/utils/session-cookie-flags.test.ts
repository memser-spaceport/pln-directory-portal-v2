import { sessionCookieFlags } from '@/utils/sessionCookies';

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
