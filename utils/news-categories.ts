/**
 * News preferences (LAB-2939/2941, tags since LAB-3000) stay hidden until the
 * flag is on: the page answers 404, and the settings menu, the For You hint and
 * Email preferences don't link to it.
 *
 * NEXT_PUBLIC_ and so build-time: changing it needs a redeploy.
 */
export const SHOW_NEWS_PREFERENCES: boolean = process.env.NEXT_PUBLIC_SHOW_NEWS_PREFERENCES === 'true';
