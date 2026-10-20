/**
 * `/events` redirects permanently to the calendar at `/events/all`, LAB-2924.
 *
 * The page used to answer a temporary 307, and the calendar named `/events` as its canonical address, so Google saw
 * two addresses for one page, each pointing at the other. Exact path only: `/events/irl`, `/events/contributors` and
 * the rest are pages of their own. CommonJS so both `next.config.mjs` and Jest can load it.
 */
const EVENTS_REDIRECTS = [
  {
    source: '/events',
    destination: '/events/all',
    permanent: true,
  },
];

module.exports = { EVENTS_REDIRECTS };
