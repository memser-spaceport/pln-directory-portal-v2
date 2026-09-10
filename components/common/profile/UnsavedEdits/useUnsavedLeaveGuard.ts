'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { UnsavedEditsApi } from './UnsavedEditsContext';

/**
 * Ask before leaving a page that has a half-edited section on it.
 *
 * **Why this does not use `router.push`.** The obvious approach — and what
 * `hooks/useUnsavedChangesWarning` does — is to monkey-patch the router's
 * `push`. In the App Router that catches almost nothing: `next/link` navigates
 * through `dispatchNavigateAction`, not through the `push` on the object
 * `useRouter()` hands you (see `next/dist/client/app-dir/link.js`). Every link
 * in the navbar is a `next/link`, so a patched `push` would let the commonest
 * way of leaving through in silence while looking like a guard.
 *
 * So the interception is at the DOM: a capture-phase click listener that reads
 * the anchor. That works whatever the framework does with it afterwards.
 *
 * Three exits, and they are not equally solvable:
 *
 * - **In-app links** — intercepted here, with the app's own prompt.
 * - **Closing the tab, reloading, following a link off-site** — `beforeunload`,
 *   which is the browser's dialog and its wording. Nothing can change that.
 * - **Back/forward** — cancellable only by pushing a history entry to pop into,
 *   which is why the sentinel below exists and why it is only there while
 *   something is actually dirty.
 */

/** Marks the entry this guard pushed, so it never mistakes another for its own. */
const SENTINEL = { unsavedLeaveGuard: true } as const;

type Pending = { kind: 'link'; href: string } | { kind: 'back' } | null;

export function useUnsavedLeaveGuard(api: UnsavedEditsApi) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending>(null);

  /**
   * Whether anything is dirty, as *state* — the one place this is not pulled.
   *
   * The history sentinel has to exist exactly while there is something to
   * protect, so this guard needs to know when that changes rather than only at
   * press time. It updates when a form crosses the dirty line, not per
   * keystroke, and only this component re-renders.
   */
  const [anyDirty, setAnyDirty] = useState(false);
  useEffect(() => {
    const sync = () => setAnyDirty(Boolean(api.firstDirty()));
    sync();
    return api.subscribe(sync);
  }, [api]);

  /** Set for the one navigation we are deliberately letting through. */
  const allowNext = useRef(false);

  /* -------------------------------------------------- closing / reloading --- */

  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      /* Asked again at the moment of the event rather than trusted from
         `anyDirty`: a save that lands between the two would otherwise still
         prompt. `preventDefault` is the part modern browsers honour; the string
         is legacy and is not shown. */
      if (!api.firstDirty()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [anyDirty, api]);

  /* ------------------------------------------------------------- in-app --- */

  useEffect(() => {
    if (!anyDirty) return;

    const onClick = (event: MouseEvent) => {
      if (allowNext.current) return;
      /* Everything the browser is about to do something else with: opening a
         new tab, downloading, a middle-click. Intercepting those would break
         them and warn about a page nobody is leaving. */
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href') ?? '';
      /* `mailto:`, `tel:` and anything off-site leave through `beforeunload`,
         which is the browser's job and already handled above. */
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      /* Same page, different hash — not leaving. */
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      if (!api.firstDirty()) return;

      event.preventDefault();
      event.stopPropagation();
      setPending({ kind: 'link', href: url.pathname + url.search + url.hash });
    };

    /* Capture, so this runs before the link's own handler gets to navigate. */
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [anyDirty, api]);

  /* ------------------------------------------------------ back / forward --- */

  useEffect(() => {
    if (!anyDirty) return;

    /**
     * A popped-into entry, so a Back press has somewhere to land that is still
     * this page — the only way to cancel one.
     *
     * Pushed **only while something is dirty**, which is the point: a sentinel
     * that were always there would make Back from a clean profile do nothing on
     * the first press.
     */
    window.history.pushState(SENTINEL, '', window.location.href);

    const onPopState = () => {
      if (allowNext.current) {
        allowNext.current = false;
        return;
      }
      if (!api.firstDirty()) return;

      // Put the entry back, so the page has not moved, and ask.
      window.history.pushState(SENTINEL, '', window.location.href);
      setPending({ kind: 'back' });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [anyDirty, api]);

  /* ------------------------------------------------------------ answers --- */

  const confirmLeave = useCallback(() => {
    const target = pending;
    setPending(null);
    if (!target) return;

    allowNext.current = true;
    if (target.kind === 'link') {
      router.push(target.href);
      return;
    }
    /* Two, not one: the sentinel this guard pushed, and the entry the person
       was trying to leave. */
    window.history.go(-2);
  }, [pending, router]);

  const cancelLeave = useCallback(() => setPending(null), []);

  return { isLeaving: pending !== null, confirmLeave, cancelLeave };
}
