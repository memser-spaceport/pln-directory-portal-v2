'use client';

import { useEffect } from 'react';

/**
 * Puts the page back at the top when it mounts. Renders nothing.
 *
 * **Why this is not one line in the view.** The view is not the first thing on
 * screen: this route has its own `loading.tsx`, which paints while the server
 * fetch runs, and a skeleton inherits the scroll position of the page you left.
 * Coming from a count line most of the way down a team profile, that meant the
 * skeleton appeared mid-page and then the real content jumped to the top under
 * you. Both surfaces need the same thing, and a skeleton is a server component
 * that cannot do it alone — so the rule lives in one client component they both
 * render, instead of two copies that drift.
 *
 * **`document.body`, not `window`.** Next scrolls the scrolling element on
 * navigation, and in this app that is not what scrolls. The member page
 * (`app/members/[id]/page.tsx`) and the home page's "back to top" button both
 * reach for `body` for the same reason.
 *
 * Optionally called because jsdom implements no scroll methods at all, and a
 * hard call would take out every test that renders either surface.
 */
export function ScrollPageToTop() {
  useEffect(() => {
    document.body.scrollTo?.({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return null;
}
