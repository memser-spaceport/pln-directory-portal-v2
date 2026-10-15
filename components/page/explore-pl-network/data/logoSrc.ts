/**
 * A map logo served through Next's image endpoint instead of its own host.
 * The page's origin speaks HTTP/2, so the ~280 logos load over one connection
 * and come back with a browser cache header; the Directory's S3 bucket serves
 * them over HTTP/1.1 (six at a time) with no cache header. The logos are
 * 128×128, so `w=128` keeps them at their own size. An SVG logo is served from
 * its own host: the image endpoint refuses SVGs (400).
 */
export function logoSrc(url: string): string {
  if (/\.svg(?:[?#]|$)/i.test(url)) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=128&q=75`;
}
