import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { previewNoindexHeaders } from '@/utils/preview-noindex-headers';

/** The X-Robots-Tag value Next.js would send for `pathname`, or null when no rule matches. */
const robotsTagFor = (env: Record<string, string | undefined>, pathname: string) => {
  const rule = previewNoindexHeaders(env).find(({ source }) => getPathMatch(source)(pathname));
  return rule?.headers.find(({ key }) => key === 'X-Robots-Tag')?.value ?? null;
};

describe('Vercel preview deployments are not indexed', () => {
  it.each(['/', '/home', '/members/cldvosb6w0blzu21kx49wulk3', '/jobs/openings/abc', '/sitemap.xml'])(
    'a preview marks %s noindex',
    (pathname) => {
      expect(robotsTagFor({ VERCEL_ENV: 'preview' }, pathname)).toBe('noindex, nofollow');
    },
  );

  it.each([
    ['production', { VERCEL_ENV: 'production' }],
    ['local development', { VERCEL_ENV: 'development' }],
    // Docker/k8s builds and a production project without exposed system env vars: stay indexable.
    ['a build without VERCEL_ENV', {}],
  ])('%s sends no X-Robots-Tag', (_, env) => {
    expect(robotsTagFor(env, '/home')).toBeNull();
  });
});
