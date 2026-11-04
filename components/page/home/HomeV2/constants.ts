/**
 * The Join card's facepile: three network founders (Juan Benet, Molly Mackinlay, Vincent Weisser), each the photo on
 * their own directory profile (live members API, read 2026-10-30; the prototype's FOUNDER_FACES).
 */
export const JOIN_FACES = [
  'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/362f9d92f96cc54f.webp',
  'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/3217a82823eb50b8.webp',
  'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/b16306f921a8dba9.webp',
];

/** The mock's shorter label for the one figure whose production label wraps in a quarter-width cell. */
export const FACT_LABEL: Record<string, string> = { 'Organizations in the network': 'Network organizations' };

/** "See all updates": the news-only page (LAB-3126). */
export const HOME_NEWS_VIEW_HREF = '/home?view=news';

/** The rail's See all targets. */
export const JOBS_HREF = '/jobs';
export const EVENTS_HREF = '/events/irl';
