/**
 * Permanent redirects from the old AI chat page (/husky) to AI Search (/ai-search), LAB-2772.
 * Old bookmarks and shared links keep working: a specific chat lands on the same chat under /ai-search.
 * CommonJS so both `next.config.mjs` and Jest can load it.
 */
const AI_SEARCH_REDIRECTS = [
  {
    source: '/husky/chat/:id',
    destination: '/ai-search/:id',
    permanent: true,
  },
  {
    source: '/husky/:path*',
    destination: '/ai-search',
    permanent: true,
  },
];

module.exports = { AI_SEARCH_REDIRECTS };
