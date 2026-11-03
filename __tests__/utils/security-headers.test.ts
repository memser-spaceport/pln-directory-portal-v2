/**
 * LAB-3094: every response carries the security headers, and the app's own uses (screen capture, clipboard,
 * fullscreen, same-origin frames) stay allowed.
 */
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { securityHeaders } from '@/utils/security-headers';

const headersFor = (pathname: string) =>
  Object.fromEntries(
    securityHeaders()
      .filter(({ source }) => getPathMatch(source)(pathname))
      .flatMap(({ headers }) => headers.map(({ key, value }) => [key, value])),
  );

describe('security headers', () => {
  it.each(['/', '/home', '/teams/abc', '/api/og/x', '/sitemap.xml'])('are on %s', (pathname) => {
    expect(headersFor(pathname)).toEqual({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "frame-ancestors 'self'",
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    });
  });

  it('leave screen capture, clipboard and fullscreen alone, and set no other CSP directive', () => {
    const { 'Permissions-Policy': permissions, 'Content-Security-Policy': csp } = headersFor('/home');
    expect(permissions).not.toMatch(/display-capture|clipboard|fullscreen/);
    expect(csp.split(';')).toHaveLength(1);
  });
});
