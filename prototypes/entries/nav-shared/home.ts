/**
 * Shared bits of the "Home" decision, so the two bars can't drift apart.
 *
 * The naming question this folder settles: the destination is **Home**, not
 * News. News is what's currently on the feed, but the feed already carries jobs
 * and event items, so "News" would describe the cargo rather than the place —
 * and would need renaming the moment the mix changes. "Home" survives that.
 */

/**
 * The accessible name production's logo doesn't have. `AppLogo`
 * (components/core/navbar/components/icons.tsx) is a bare `<svg>` with no
 * `<title>` and no label, so today the sole route to the feed announces itself
 * as "link". Carry this to production separately — prototypes don't edit it.
 */
export const LOGO_LABEL = 'Protocol Labs Directory, home';

/**
 * Where Home points when a prototype doesn't own the feed itself.
 */
export const HOME_HREF = '/prototypes/newsfeed';

/**
 * `html, body { height: 100dvh }` in app/globals.scss makes the scroll
 * container ambiguous — depending on the route it's the body, the documentElement
 * or the window. Ask all three rather than guessing; the two that aren't
 * scrolling are no-ops.
 */
export function scrollToTop() {
  const opts: ScrollToOptions = { top: 0, behavior: 'smooth' };
  window.scrollTo(opts);
  document.body?.scrollTo?.(opts);
  document.documentElement?.scrollTo?.(opts);
}
