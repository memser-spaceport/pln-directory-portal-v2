import type { MetadataRoute } from 'next';
import { getApplicationBaseUrl } from '@/utils/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getApplicationBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/spotlight/', '/api/og/'],
        disallow: ['/deals/', '/founder-guides', '/investors', '/settings/', '/api/'],
      },
    ],
    sitemap: baseUrl ? `${baseUrl}/sitemap.xml` : undefined,
    host: baseUrl || undefined,
  };
}
