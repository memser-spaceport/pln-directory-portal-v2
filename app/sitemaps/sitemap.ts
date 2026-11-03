import type { MetadataRoute } from 'next';
import { isSitemapSection, SITEMAP_SECTIONS, sitemapSection } from '@/services/seo/sitemapSections';

/**
 * One sitemap per section, at `/sitemaps/sitemap/<section>.xml` (LAB-3106). `/sitemap.xml` is their index
 * (`app/sitemap.xml/route.ts`); Next does not write a sitemap index itself.
 */
export async function generateSitemaps() {
  return SITEMAP_SECTIONS.map((id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  return isSitemapSection(id) ? sitemapSection(id) : [];
}
