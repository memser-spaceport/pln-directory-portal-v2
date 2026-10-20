import type { Metadata } from 'next';

import { DEMO_DAY_PATH } from '@/utils/constants';
import { absoluteUrl } from '@/utils/seo';

/**
 * Metadata for the two public pages of a Demo Day, its landing page and its completed view (LAB-2924): indexable, with
 * the page's own address as canonical. Every other page under a Demo Day is a dashboard and stays noindex (its layout).
 */
export function publicDemoDayPageMetadata(demoDayId: string, subpath = ''): Metadata {
  return {
    robots: { index: true, follow: true },
    alternates: { canonical: absoluteUrl(`${DEMO_DAY_PATH}/${encodeURIComponent(demoDayId)}${subpath}`) },
  };
}
