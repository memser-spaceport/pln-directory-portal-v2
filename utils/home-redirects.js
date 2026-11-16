/**
 * The homepage lives at the site root (LAB-3255). It used to be /home, and old links, digest emails and the
 * backend's notification links still point there. Next.js carries the query string across a redirect
 * (`/home?news=<uid>` → `/?news=<uid>`), and the browser keeps the fragment (`#login`).
 * CommonJS so both `next.config.mjs` and Jest can load it.
 */
const HOME_REDIRECTS = [
  {
    source: '/home',
    destination: '/',
    permanent: true,
  },
];

module.exports = { HOME_REDIRECTS };
