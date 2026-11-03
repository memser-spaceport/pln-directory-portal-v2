import { getApplicationBaseUrl } from '@/utils/seo';
import { sitemapIndexXml } from '@/services/seo/sitemapSections';

/**
 * `/sitemap.xml`: the index of the per-section sitemaps (LAB-3106), at the address robots.txt and Search Console already
 * use. Its content depends only on the deployment's base URL, so it is cached for an hour like the sections.
 */
export const revalidate = 3600;

export function GET() {
  const baseUrl = getApplicationBaseUrl();
  return new Response(sitemapIndexXml(baseUrl), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
