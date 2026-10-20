#!/usr/bin/env node
/**
 * What a search engine gets from a deployed site (LAB-2876): page content in the server HTML, real 404s, permanent
 * redirects, canonical addresses, noindex pages, and a sample of the sitemap. Fetches as a crawler does: no cookies,
 * no JavaScript.
 *
 *   npm run seo:check -- https://directory-portal-lab-2876.os.pl.xyz [--sample 20]
 *
 * Exits non-zero when any check fails. The specs it checks: openspec/specs/{profiles,teams,job-board,seo}.
 */

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? '').replace(/\/$/, '');
const sampleIndex = args.indexOf('--sample');
const sampleSize = sampleIndex >= 0 ? Number(args[sampleIndex + 1]) : 15;

if (!base) {
  console.error('Usage: node scripts/seo-check.mjs <base-url> [--sample N]');
  process.exit(2);
}

const UNKNOWN_ID = 'doesnotexist000000000000';
const results = [];
const record = (name, ok, detail = '') => results.push({ name, ok, detail });

async function get(path) {
  const response = await fetch(`${base}${path}`, {
    redirect: 'manual',
    headers: { 'user-agent': 'seo-check (LAB-2876)' },
  });
  const html = response.status === 200 ? await response.text() : '';
  return { status: response.status, location: response.headers.get('location') ?? '', html };
}

/** The text a crawler reads without running scripts. */
const visibleText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
const pageName = (html) =>
  (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')
    .split(' | ')[0]
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'");
const canonicalPath = (html) => {
  const href = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  return href ? new URL(href, base).pathname : null;
};
const isNoindex = (html) => /<meta name="robots" content="[^"]*noindex/.test(html);
/** React gave up on the server render of a boundary and left it to the browser: the content is not in the HTML. */
const hasClientFallback = (html) => html.includes('$RX(');
const linkCount = (html, prefix) => new Set(html.match(new RegExp(`href="${prefix}[a-z0-9]{20,}"`, 'g')) ?? []).size;
const locationPath = (location) => (location ? new URL(location, base).pathname : '');

async function checkListing(path, prefix, min) {
  const { status, html } = await get(path);
  const links = linkCount(html, prefix);
  record(
    `${path} lists ${prefix}… links in its server HTML`,
    status === 200 && links >= min,
    `${status}, ${links} links`,
  );
}

async function checkProfile(path) {
  const { status, html } = await get(path);
  const name = pageName(html);
  const ok = status === 200 && !!name && visibleText(html).includes(name) && !hasClientFallback(html);
  record(
    `${path} shows "${name}" in its server HTML`,
    ok,
    `${status}${hasClientFallback(html) ? ', client fallback' : ''}`,
  );
}

async function checkStatus(path, expected) {
  const { status } = await get(path);
  record(`${path} answers ${expected}`, status === expected, String(status));
}

async function checkRedirect(path, target) {
  const { status, location } = await get(path);
  const ok = (status === 308 || status === 301) && locationPath(location) === target;
  record(`${path} redirects permanently to ${target}`, ok, `${status} ${location}`);
}

async function checkCanonical(path, expected) {
  const { status, html } = await get(path);
  const canonical = canonicalPath(html);
  record(`${path} has canonical ${expected}`, status === 200 && canonical === expected, `${status}, ${canonical}`);
}

async function checkNoindex(path) {
  const { status, html } = await get(path);
  record(`${path} is noindex`, status === 200 && isNoindex(html), String(status));
}

async function sitemapUrls() {
  const { status, html } = await get('/sitemap.xml');
  if (status !== 200) return [];
  // The sitemap is XML, but `get` only reads bodies of 200 responses, which this is.
  return [...html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

async function checkSitemapSample(paths) {
  const profiles = paths.filter((p) => /^\/(members|teams|projects|jobs\/openings)\/[^/]+$/.test(p));
  const statics = paths.filter((p) => !profiles.includes(p));
  const sample = [...statics, ...profiles.sort(() => Math.random() - 0.5).slice(0, sampleSize)];
  for (const path of sample) {
    const { status, location, html } = await get(path);
    const canonical = status === 200 ? canonicalPath(html) : null;
    const ok = status === 200 && !isNoindex(html) && (canonical === null || canonical === path);
    record(
      `sitemap entry ${path} is indexable as listed`,
      ok,
      `${status}${location ? ` → ${location}` : ''}${isNoindex(html) ? ', noindex' : ''}${canonical && canonical !== path ? `, canonical ${canonical}` : ''}`,
    );
  }
}

const sitemap = await sitemapUrls();
record('sitemap.xml lists URLs', sitemap.length > 0, `${sitemap.length} URLs`);
const first = (prefix) => sitemap.find((p) => p.startsWith(prefix) && p.split('/').length === 3);

// Server HTML carries the content (profiles, teams).
await checkListing('/members', '/members/', 10);
await checkListing('/teams', '/teams/', 10);
await checkListing('/projects', '/projects/', 10);
await checkListing('/jobs', '/jobs/openings/', 1);
for (const prefix of ['/members/', '/teams/', '/projects/']) {
  const path = first(prefix);
  if (path) await checkProfile(path);
  else record(`a ${prefix}… profile from the sitemap`, false, 'none listed');
}
{
  const { status, html } = await get('/home');
  record('/home has content in its server HTML', status === 200 && visibleText(html).length > 500, String(status));
}

// Unknown profiles are real 404s (profiles).
for (const kind of ['members', 'teams', 'projects']) await checkStatus(`/${kind}/${UNKNOWN_ID}`, 404);

// One address per page (seo, job-board).
await checkRedirect('/', '/home');
await checkRedirect('/events', '/events/all');
await checkRedirect('/jobs/companies/protocol-labs/jobs', '/jobs');
await checkRedirect('/companies/protocol-labs/jobs/1-role', '/jobs');
await checkCanonical('/events/all', '/events/all');
await checkCanonical('/demoday', '/demoday');
await checkCanonical('/members?searchBy=lab', '/members');
await checkNoindex('/sign-up?returnTo=/members/x');

// What the sitemap lists is indexable as listed (seo).
await checkSitemapSample(sitemap);

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} passed against ${base}`);
process.exit(failed.length ? 1 : 0);
