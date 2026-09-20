import type { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';

export function getApplicationBaseUrl(): string {
  return (process.env.APPLICATION_BASE_URL ?? '').replace(/\/$/, '');
}

export function absoluteUrl(path: string): string {
  const base = getApplicationBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

export function listingPageMetadata(opts: { title: string; description: string; path: string }): Metadata {
  const url = absoluteUrl(opts.path);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      images: [
        {
          url: SOCIAL_IMAGE_URL,
          width: 1280,
          height: 640,
          alt: 'Protocol Labs Directory',
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [SOCIAL_IMAGE_URL],
    },
  };
}

export function htmlToPlainSnippet(html: string | null | undefined, max = 160): string {
  if (!html) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
