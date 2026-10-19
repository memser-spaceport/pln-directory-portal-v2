import type { MetadataRoute } from 'next';
import { getApplicationBaseUrl } from '@/utils/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getApplicationBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        /* `/api/jobs/` (LAB-2887): the job board fills itself from /api/jobs/list and /api/jobs/filters, and
           Google renders a page without any resource robots.txt blocks — so with `/api/` blocked it saw an
           empty board. The longest matching rule wins, so this beats `Disallow: /api/`. */
        allow: ['/', '/api/spotlight/', '/api/og/', '/api/jobs/'],
        disallow: ['/deals/', '/founder-guides', '/investors', '/settings/', '/api/'],
      },
    ],
    sitemap: baseUrl ? `${baseUrl}/sitemap.xml` : undefined,
    host: baseUrl || undefined,
  };
}
