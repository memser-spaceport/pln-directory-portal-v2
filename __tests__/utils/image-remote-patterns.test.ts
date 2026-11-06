import { hasRemoteMatch } from 'next/dist/shared/lib/match-remote-pattern';
import { IMAGE_REMOTE_PATTERNS } from '@/utils/image-remote-patterns';

/** Asks Next.js's own matcher whether the image optimizer accepts this URL. */
const isAllowed = (url: string) => hasRemoteMatch([], IMAGE_REMOTE_PATTERNS, new URL(url));

describe('LAB-2978: the image optimizer accepts only the listed hosts', () => {
  it.each([
    'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/9bb7aea917c8bd9d.webp',
    'https://pl-directory-images-dev.s3.us-west-1.amazonaws.com/d5e7dce313f522b2.png',
    'https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg',
    'https://pl-directory-uploads-prod.s3.us-west-1.amazonaws.com/some-file.png',
    'https://xmwhmjwf0rjrrlhw.public.blob.vercel-storage.com/agoric-1-128x128.webp',
  ])('accepts %s', (url) => {
    expect(isAllowed(url)).toBe(true);
  });

  it.each([
    'https://example.com/image.png',
    'https://evil.s3.us-west-1.amazonaws.com/image.png',
    'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com.evil.com/image.png',
    'https://169.254.169.254/latest/meta-data',
    'http://pl-directory-images-prod.s3.us-west-1.amazonaws.com/9bb7aea917c8bd9d.webp',
  ])('refuses %s', (url) => {
    expect(isAllowed(url)).toBe(false);
  });

  it('has no wildcard host', () => {
    expect(IMAGE_REMOTE_PATTERNS.length).toBeGreaterThan(0);
    for (const pattern of IMAGE_REMOTE_PATTERNS) {
      expect(pattern.protocol).toBe('https');
      expect(pattern.hostname).not.toContain('*');
    }
  });
});
