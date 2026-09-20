'use client';

import { useEffect, type RefObject } from 'react';

/** The custom property every "below the site chrome" rule reads. */
const CHROME_HEIGHT_VAR = '--app-header-height';

/**
 * Publishes the site header's real height as `--app-header-height`.
 *
 * `SiteHeader` is a stack, not a row: `DomainMigrationBanner` and
 * `CompleteYourProfile` sit above the navbar inside the same sticky `<header>`,
 * and two more bars are one uncomment away. Each is conditional, so the chrome
 * is 56px tall for one person and 96px for the next on the same page.
 *
 * Roughly forty rules position themselves below that chrome — sticky
 * sub-headers, `calc(100vh - …)` panes, and the search overlay's `top` — and
 * every one of them read a *static* 56/80px token. With any bar showing, all of
 * them were short by exactly its height, which is what slid the search overlay
 * up under the header. Measuring here fixes all of them at once, without
 * touching a single rule.
 *
 * ## Two traps
 *
 * **Do not let anything inside the header read this value.** The height being
 * published is the header's own; a descendant sizing itself from it feeds
 * straight back in and ratchets upward on every observation. `NavBar` used to
 * do exactly this, which is why the navbar row now reads `--app-navbar-height`
 * and this one is documented as off-limits to the header's own subtree.
 *
 * **The property is removed on unmount, not zeroed.** Bare routes render no
 * header at all (`isBareRoute`), and removing the inline value lets the
 * stylesheet's static default apply again — which is exactly what those routes
 * got before any of this existed. Leaving a stale measurement behind would
 * offset a page that has no chrome to offset from.
 *
 * Rounded up rather than to nearest: a fractional underestimate tucks the top
 * of an overlay under the header, while an overestimate is an invisible
 * sub-pixel gap.
 */
export function useHeaderHeightVar(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    /* No ResizeObserver (jsdom without a polyfill, very old browsers): leave the
       stylesheet default in place rather than publishing a value that cannot be
       kept up to date. */
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }

    const root = document.documentElement;
    /* `getBoundingClientRect` rather than the entry's `contentRect`: that one is
       the content box, so any padding or border on the header would be dropped
       from an offset that has to clear the whole element. */
    const publish = () => {
      root.style.setProperty(CHROME_HEIGHT_VAR, `${Math.ceil(el.getBoundingClientRect().height)}px`);
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);

    return () => {
      observer.disconnect();
      root.style.removeProperty(CHROME_HEIGHT_VAR);
    };
  }, [ref]);
}
