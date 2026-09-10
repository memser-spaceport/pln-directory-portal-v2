'use client';

import { useDebounce } from 'react-use';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { FilterStoreHook } from '@/services/filters/types';

/**
 * How the URL gets written, and therefore how back/forward is observed.
 *
 * 'router' — push through the Next router, so a Server Component reading
 *   `searchParams` re-runs and refilters. Required wherever the URL is the data
 *   source (members). Back/forward arrives as a new `useSearchParams` value.
 *
 * 'history' — `history.pushState` only, no RSC round-trip. For lists filtered in
 *   the browser, where the URL is a bookmark rather than a query (teams). Next
 *   never sees these writes, so back/forward has to come from `popstate`.
 */
export type FilterUrlStrategy = 'router' | 'history';

interface Props {
  store: FilterStoreHook;
  /**
   * Param keys this store owns. Everything else in the URL is left as found.
   * Defaults to the store's own `trackedParams`; pass explicitly when a page
   * syncs a different set than it declared.
   */
  trackedParams?: readonly string[];
  strategy?: FilterUrlStrategy;
  debounceTime?: number;
  /** 'router' only: also `router.refresh()` on a clear, to re-run a server query that returns nothing new. */
  refreshOnClear?: boolean;
  children?: ReactNode;
}

/**
 * Two-way binding between a filter store and the URL: hydrates the store from the
 * URL before consumers first paint, then writes changes back, debounced.
 *
 * Children are withheld until hydration, so a rail never renders one frame of
 * "no filters applied" over a filtered URL.
 *
 * Untracked params are always preserved — the URL is rebuilt from the current
 * query string with only `trackedParams` overwritten, never from the store alone.
 * Pages carry params that have nothing to do with filtering (a `?dialog=` deep
 * link, a `?viewType=`), and rebuilding from the store drops them.
 *
 * Replaces six page-specific copies (members, teams, jobs), which had drifted on
 * every one of these points.
 */
export function FilterStoreUrlSync(props: Props) {
  const { store, trackedParams, strategy = 'router', debounceTime = 0, refreshOnClear, children } = props;

  const router = useRouter();
  const searchParams = useSearchParams();
  const { params, setAllParams, _clearImmediate } = store();

  const [isHydrated, setIsHydrated] = useState(false);
  const didHydrate = useRef(false);
  const lastWritten = useRef<string | null>(null);

  // Memoized so it can't re-create `writeUrl` on every render.
  const keys = useMemo(() => trackedParams ?? store.trackedParams ?? [], [trackedParams, store]);

  useLayoutEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    setAllParams(new URLSearchParams(window.location.search));
    // A one-shot gate, not a cascading render: `didHydrate` makes it unrepeatable,
    // and "the URL has been read into the store" is not a fact the store records.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, [setAllParams]);

  /*
    Back/forward under 'router'.

    Keyed to the URL *string* changing, not to `searchParams` identity, and not
    re-run on our own renders. This component subscribes to the whole store (the
    write side needs `params`), so it re-renders on every filter change — reseeding
    on each of those would fight the user's own edit and, with a fresh
    `URLSearchParams` each pass, spin. The old hydrators dodged this only by
    subscribing through a selector, which a merged component can't do.
  */
  const urlString = searchParams.toString();
  const lastObservedUrl = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!isHydrated || strategy !== 'router') return;

    if (lastObservedUrl.current === null || lastObservedUrl.current === urlString) {
      lastObservedUrl.current = urlString;
      return;
    }

    lastObservedUrl.current = urlString;
    setAllParams(new URLSearchParams(urlString));
  }, [isHydrated, strategy, urlString, setAllParams]);

  useLayoutEffect(() => {
    if (!isHydrated || strategy !== 'history') return;

    const onPopState = () => setAllParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', onPopState);

    return () => window.removeEventListener('popstate', onPopState);
  }, [isHydrated, strategy, setAllParams]);

  const writeUrl = useCallback(() => {
    const current = window.location.search.replace(/^\?/, '');
    const next = new URLSearchParams(current);

    keys.forEach((key) => {
      const value = params.get(key);
      if (value !== null && value !== '') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });

    const nextString = next.toString();

    // Unchanged (the first pass included, where the store was just seeded from
    // this same URL), or already written — either way it would only add history noise.
    if (nextString === current || nextString === lastWritten.current) {
      return;
    }

    lastWritten.current = nextString;
    const url = nextString ? `${window.location.pathname}?${nextString}` : window.location.pathname;

    if (strategy === 'history') {
      window.history.pushState(null, '', url);
      return;
    }

    router.push(url, { scroll: false });

    if (_clearImmediate && refreshOnClear) {
      router.refresh();
    }
  }, [params, keys, strategy, refreshOnClear, _clearImmediate, router]);

  // Clearing is one deliberate action; it shouldn't wait out the typing debounce.
  useDebounce(
    () => {
      if (!isHydrated) return;
      writeUrl();
    },
    _clearImmediate ? 0 : debounceTime,
    [params, _clearImmediate, isHydrated],
  );

  if (!isHydrated) return null;

  return <>{children}</>;
}
