/**
 * `X-Robots-Tag: noindex, nofollow` on every response of a non-production deployment.
 *
 * Two kinds of deployment get it:
 * - Vercel previews (`VERCEL_ENV=preview`). Vercel adds this header itself on `*.vercel.app`, but not on a custom
 *   domain aliased to a preview. Google indexed `pr-3351.preview.dev.os.pl.xyz` that way, and it ranked for
 *   "Protocol Labs Directory" next to production.
 * - Builds with `SEO_NOINDEX=true`: the k8s feature envs (`directory-portal-lab-<n>.os.pl.xyz`). They don't run on
 *   Vercel, so `VERCEL_ENV` is unset there. Google crawled the lab-2837 env while it was up. The deploy passes the
 *   flag in `extra_env_json`; the pipeline writes it to `.env.production`, which `next build` reads before this
 *   config.
 *
 * Opt-in on purpose rather than "not production": a production build where neither is set stays indexable.
 * robots.txt is left alone on purpose: blocking the crawl would hide this header from Google and keep the indexed
 * URLs listed. The header is fixed at build time (next.config `headers()`), so the flag must be set for the build.
 * CommonJS so both `next.config.mjs` and Jest can load it.
 */
function nonProductionNoindexHeaders(env = process.env) {
  if (env.VERCEL_ENV !== 'preview' && env.SEO_NOINDEX !== 'true') return [];
  return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
}

module.exports = { nonProductionNoindexHeaders };
