'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { PAGE_ROUTES } from '@/utils/constants';

/**
 * The one place that builds a `#login` URL and decides whether Next may scroll for it.
 *
 * ## Why this exists
 *
 * Every "Sign in" affordance opens the Privy modal by pushing `#login` onto the URL;
 * `AuthBox` watches the hash and mounts `AuthInfo`. That push is a Next navigation, and
 * Next insists on scrolling for it:
 *
 *   1. Same pathname + same search + new hash is classified `onlyHashChange`, which sets
 *      `forceScroll = true` — "should scroll regardless of per-node state". Nothing
 *      downstream can opt out.
 *   2. Nothing in the app has `id="login"`, so the hash resolves to no element and Next
 *      falls back to the current layout segment's DOM node.
 *   3. The scroll branch is guarded on the *hash string*, not on whether an element was
 *      found, so it calls `segmentNode.scrollIntoView()` and never reaches the
 *      scroll-to-top path below it.
 *   4. Smooth scrolling is deliberately left enabled for hash-only navigations, so the
 *      result animates.
 *
 * Net effect: the page slides a few pixels as the segment wrapper is aligned to the
 * viewport top (offset by the `scroll-margin-top` that `app/globals.scss`'s `[id]`
 * catch-all puts on anything with an id). `{ scroll: false }` closes both gates — it
 * clears the forced scrollRef *and* stops `hashFragment` being read off the new URL.
 *
 * ## Why the rule is conditional
 *
 * `{ scroll: false }` is right for same-page gating and *wrong* for cross-page gating.
 * From `/sign-up` we send the user to `/#login`, which is a real page navigation —
 * suppressing the scroll there lands them on a new page at the old page's scroll offset.
 * So: suppress scroll only when the pathname is unchanged.
 *
 * That also covers the middle case — same pathname, different search (`?news=`,
 * `?open-modal=true`, `?prefillEmail=`). Those aren't `onlyHashChange`, but the user
 * stays visually on the same page, so a scroll reset is still wrong.
 *
 * Analytics stay at the call site. Several triggers treat the moment before this push as
 * the guest→member funnel's drop-off marker, so this helper must not absorb or reorder
 * them.
 */

export type LoginRedirectOptions = {
  /**
   * Path (with optional search) to return to after login.
   * Defaults to the current pathname + search.
   */
  returnTo?: string;
  /** Extra query params merged into the return URL. */
  params?: Record<string, string>;
  /** Use `replace` instead of `push`, so Back does not restore the login gate. */
  replace?: boolean;
};

export type LoginTarget = {
  /** The URL to navigate to, hash included. */
  href: string;
  /** What to pass as Next's `scroll` option. `false` suppresses the hash scroll. */
  scroll: boolean;
};

type CurrentLocation = {
  pathname: string;
  search: string;
};

/**
 * Pure core of {@link useLoginRedirect} — exported for tests and for the rare caller
 * that needs the URL without navigating.
 */
export function buildLoginTarget(current: CurrentLocation, options: LoginRedirectOptions = {}): LoginTarget {
  const { returnTo, params } = options;

  // `/sign-up` can't host the round trip: the wizard's own state is gone by the time
  // the user comes back, so the gate sends them to the root instead. This policy used
  // to be copy-pasted into five call sites.
  const fallback =
    current.pathname === PAGE_ROUTES.SIGNUP ? '/' : `${current.pathname}${current.search}`;
  const base = returnTo ?? fallback;

  const [basePath, baseSearch = ''] = base.split('?');
  const searchParams = new URLSearchParams(baseSearch);
  if (params) {
    Object.entries(params).forEach(([key, value]) => searchParams.set(key, value));
  }

  const query = searchParams.toString();
  const href = `${basePath}${query ? `?${query}` : ''}#login`;

  return {
    href,
    // Cross-page gating must keep Next's default scroll — see the doc comment above.
    scroll: basePath !== current.pathname,
  };
}

/**
 * Sends a signed-out visitor to the `#login` gate without disturbing their scroll
 * position. Call sites should never write the literal `#login` themselves.
 *
 * ```tsx
 * const goToLogin = useLoginRedirect();
 *
 * goToLogin();                                        // return to the current page
 * goToLogin({ returnTo: `/home?news=${uid}` });       // return to a specific view
 * goToLogin({ params: { 'open-modal': 'true' } });    // carry extra state through
 * ```
 */
export function useLoginRedirect() {
  const router = useRouter();

  return useCallback(
    (options: LoginRedirectOptions = {}) => {
      // Read live, not via usePathname/useSearchParams: several callers navigate from
      // pages whose URL was written with raw history.replaceState, which Next's hooks
      // never learn about.
      const { href, scroll } = buildLoginTarget(
        { pathname: window.location.pathname, search: window.location.search },
        options,
      );

      // Called through `router` rather than extracted into a variable — the app router
      // instance's methods are not guaranteed to be bound.
      if (options.replace) {
        router.replace(href, { scroll });
      } else {
        router.push(href, { scroll });
      }
    },
    [router],
  );
}
