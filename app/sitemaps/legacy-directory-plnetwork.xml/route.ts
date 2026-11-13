import { legacyHostSitemapXml, legacyHostUrls } from '@/services/seo/legacyHostSitemap';

/**
 * `/sitemaps/legacy-directory-plnetwork.xml`: the old host's addresses, for the domain move (see
 * `services/seo/legacyHostSitemap.ts`). Production only; every other deployment answers 404. Cached for an hour like the
 * section sitemaps it is built from. The session proxy skips `sitemaps/`, so it carries no cookie headers.
 */
export const revalidate = 3600;

export async function GET() {
  const urls = await legacyHostUrls();
  if (urls.length === 0) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(legacyHostSitemapXml(urls), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
