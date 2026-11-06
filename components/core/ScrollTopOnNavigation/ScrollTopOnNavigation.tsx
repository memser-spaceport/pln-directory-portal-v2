'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Opens each new page at the top (LAB-3169).
 *
 * `app/globals.scss` gives `html` and `body` a fixed `100dvh` with `overflow-x: hidden`, so `<body>` is the element
 * that scrolls. Next's scroll-to-top on navigation resets `<html>` and then only scrolls the new segment into view
 * when it is off screen, so a link from a scrolled page (a Home focus-area card, a team in the list) opened the next
 * page part-way down. This does that reset on `<body>`.
 *
 * - A new page is a new pathname, or a new `?view=` on the same path: `/home?view=news` is its own page.
 *   Other query changes (filters, `?news=` modals, `?feed=`) stay where they are, as Next's `{ scroll: false }`
 *   callers expect: every one of them keeps the pathname.
 * - Back and Forward keep today's behaviour (no reset), and so does the first page load.
 * - A URL with a `#hash` is left to Next, which scrolls to that element itself.
 * - It runs before paint and scrolls instantly, so the new page never shows at the old offset.
 */
export function ScrollTopOnNavigation() {
  const pathname = usePathname();
  const view = useSearchParams()?.get('view') ?? '';
  const page = `${pathname}?view=${view}`;

  const lastPage = useRef(page);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useLayoutEffect(() => {
    if (lastPage.current === page) return;
    lastPage.current = page;

    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if (window.location.hash) return;

    // Instant: `<body id="body">` matches globals.scss's `[id]` rule, which makes it scroll smoothly, and a smooth
    // reset is still under way when Next scrolls the incoming page's skeleton into view, so that scroll won.
    document.body.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);

  return null;
}
