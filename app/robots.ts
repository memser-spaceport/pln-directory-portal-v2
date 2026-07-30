import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.APPLICATION_BASE_URL ?? '').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/spotlight/'],
        disallow: ['/deals/', '/founder-guides', '/investors', '/settings/', '/api/'],
      },
    ],
    sitemap: baseUrl ? `${baseUrl}/sitemap.xml` : undefined,
    host: baseUrl || undefined,
  };
}
