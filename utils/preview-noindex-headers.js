/**
 * `X-Robots-Tag: noindex, nofollow` on every response of a Vercel preview deployment.
 *
 * Vercel adds this header itself on `*.vercel.app`, but not on a custom domain aliased to a preview. Google
 * indexed `pr-3351.preview.dev.os.pl.xyz` that way, and it ranked for "Protocol Labs Directory" next to
 * production. The page's canonical points at the dev base URL, which 404s, so Google ignored the canonical.
 *
 * Keyed on `VERCEL_ENV === 'preview'` rather than "not production". That way a production build where the
 * variable is missing (another host, or system env vars not exposed) stays indexable. robots.txt is left alone
 * on purpose: blocking the crawl would hide this header from Google and keep the indexed preview URLs listed.
 * CommonJS so both `next.config.mjs` and Jest can load it.
 */
function previewNoindexHeaders(env = process.env) {
  if (env.VERCEL_ENV !== 'preview') return [];
  return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
}

module.exports = { previewNoindexHeaders };
