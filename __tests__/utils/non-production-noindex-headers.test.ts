import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { nonProductionNoindexHeaders } from '@/utils/non-production-noindex-headers';

/** The X-Robots-Tag value Next.js would send for `pathname`, or null when no rule matches. */
const robotsTagFor = (env: Record<string, string | undefined>, pathname: string) => {
  const rule = nonProductionNoindexHeaders(env).find(({ source }) => getPathMatch(source)(pathname));
  return rule?.headers.find(({ key }) => key === 'X-Robots-Tag')?.value ?? null;
};

describe('Non-production deployments are not indexed', () => {
  it.each(['/', '/home', '/members/cldvosb6w0blzu21kx49wulk3', '/jobs/openings/abc', '/sitemap.xml'])(
    'a Vercel preview marks %s noindex',
    (pathname) => {
      expect(robotsTagFor({ VERCEL_ENV: 'preview' }, pathname)).toBe('noindex, nofollow');
    },
  );

  it('a feature env build with SEO_NOINDEX=true is noindex', () => {
    expect(robotsTagFor({ SEO_NOINDEX: 'true' }, '/home')).toBe('noindex, nofollow');
  });

  it.each([
    ['production', { VERCEL_ENV: 'production' }],
    ['local development', { VERCEL_ENV: 'development' }],
    // Docker/k8s builds and a production project without exposed system env vars: stay indexable.
    ['a build without VERCEL_ENV', {}],
    // Only the exact string turns it on, so a stray value can't noindex production.
    ['SEO_NOINDEX=false', { VERCEL_ENV: 'production', SEO_NOINDEX: 'false' }],
    ['SEO_NOINDEX=1', { SEO_NOINDEX: '1' }],
  ])('%s sends no X-Robots-Tag', (_, env) => {
    expect(robotsTagFor(env, '/home')).toBeNull();
  });
});
