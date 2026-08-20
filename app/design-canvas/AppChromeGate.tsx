'use client';

/**
 * The chromeless-route branch for the design canvas.
 *
 * DELETE WITH: the `design-canvas/` folder.
 *
 * The canvas is not a page of the app — it is a full-viewport surface that photographs the app's pages — so
 * the header and the mobile bottom bar the root layout wraps every route in have to be absent on
 * `/design-canvas`. Absent, not hidden: `check-canvas.mjs` asserts that no `header`, `nav` or `aside` exists
 * outside the canvas surface, and it reads the DOM with `querySelectorAll`, which finds an element that CSS
 * has set to `display: none` exactly as readily as a visible one.
 *
 * That is the right assertion rather than a pedantic one. A hidden landmark is still in the accessibility
 * tree's reach and still a thing the next person has to explain, and the canvas claims to be structurally
 * outside the app rather than a page of it wearing a stylesheet.
 *
 * A client component because the root layout is a server component and cannot read the pathname. It renders
 * its children everywhere else, so every route but this one is untouched.
 */

import { usePathname } from 'next/navigation';

export function AppChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  /* The whole subtree, so `/design-canvas/<slug>` is covered as well as the index. */
  if (pathname?.startsWith('/design-canvas')) return null;
  return <>{children}</>;
}
