/**
 * The old host's sitemap for the domain move. `directory.plnetwork.io` answers every path, robots.txt included, with a
 * 301 to the same path on os.pl.xyz (a Cloudflare rule, not this app). Three weeks after the Change of Address,
 * Search Console had seen the redirect on only 122 old URLs: the old property had no sitemap to make Google recrawl them.
 * Google's site-move guide says to submit a sitemap of the old URLs during a move.
 *
 * The file lives on os.pl.xyz because nothing on the old host answers without redirecting. Google accepts a sitemap
 * that lists another host's URLs when one account has verified both hosts in Search Console, as is the case here, so
 * it is submitted in the os.pl.xyz property by hand. It is not in `/sitemap.xml`, which lists only addresses meant to
 * be indexed. Delete it once Search Console shows the move complete.
 */
import { SITEMAP_SECTIONS, sitemapSection } from '@/services/seo/sitemapSections';
import { getApplicationBaseUrl } from '@/utils/seo';

/** The old host, which 301s path for path to {@link LEGACY_HOST_TARGET}. */
export const LEGACY_HOST = 'https://directory.plnetwork.io';

/** The one deployment the old host redirects to. Any other deployment's addresses are not the old host's. */
export const LEGACY_HOST_TARGET = 'https://os.pl.xyz';

export const LEGACY_SITEMAP_PATH = '/sitemaps/legacy-directory-plnetwork.xml';

/**
 * Every address the sitemap index lists, on the old host, plus the old root, the old property's most-seen page, and
 * the old /home, which the homepage was until LAB-3255 moved it to the root. No
 * `lastmod`: the date an old URL became a redirect is not recorded, and a made-up one would teach Google to distrust
 * the field. Empty on any deployment but production, whose entity ids are not the old host's.
 */
export async function legacyHostUrls(): Promise<string[]> {
  const baseUrl = getApplicationBaseUrl();
  if (baseUrl !== LEGACY_HOST_TARGET) {
    return [];
  }

  const sections = await Promise.all(SITEMAP_SECTIONS.map((section) => sitemapSection(section)));
  const paths = sections.flat().map((entry) => {
    const url = new URL(entry.url);
    return `${url.pathname}${url.search}`;
  });
  return [...new Set(['/', '/home', ...paths])].map((path) => `${LEGACY_HOST}${path}`);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function legacyHostSitemapXml(urls: string[]): string {
  const entries = urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}
