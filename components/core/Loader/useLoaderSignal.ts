'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Don't paint at all if the work resolves faster than this — a 90ms flash reads as a glitch. */
export const SHOW_DELAY_MS = 180;
/** Once painted, hold it at least this long so it never blinks in and out. */
export const MIN_VISIBLE_MS = 400;
/** Backstop: a mutation that throws before its `finally` would otherwise strand the bar. */
export const SAFETY_TIMEOUT_MS = 15000;

/**
 * Tracks a `document`-level loader CustomEvent and returns whether the bar should paint.
 *
 * IMPORTANT — this is deliberately a boolean, not a reference count. The call sites are
 * unbalanced (105 `triggerLoader(true)` vs 100 `triggerLoader(false)`); dozens fire `true`
 * and rely on the route-change clear below rather than ever firing `false`. A counter would
 * never return to zero and the bar would stick forever. Two concurrent operations therefore
 * share one boolean and the first to finish hides the bar — pre-existing behaviour, kept.
 */
export function useLoaderSignal(eventName: string): boolean {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  type Timer = ReturnType<typeof setTimeout> | undefined;
  const showTimer = useRef<Timer>(undefined);
  const hideTimer = useRef<Timer>(undefined);
  const safetyTimer = useRef<Timer>(undefined);
  const shownAt = useRef<number | null>(null);

  const stop = useCallback(() => {
    clearTimeout(showTimer.current);
    clearTimeout(safetyTimer.current);
    showTimer.current = undefined;
    safetyTimer.current = undefined;

    if (shownAt.current === null) {
      // Armed but never painted. `visible` is true only while `shownAt` is set, so there is
      // nothing to unset — returning without a setState also keeps the route-change effect
      // below free of synchronous state updates (react-hooks/set-state-in-effect).
      return;
    }

    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      hideTimer.current = undefined;
      shownAt.current = null;
      setVisible(false);
    }, remaining);
  }, []);

  const armSafety = useCallback(() => {
    clearTimeout(safetyTimer.current);
    safetyTimer.current = setTimeout(stop, SAFETY_TIMEOUT_MS);
  }, [stop]);

  const start = useCallback(() => {
    // A new operation began while the previous one was serving out its minimum — keep it up.
    clearTimeout(hideTimer.current);
    hideTimer.current = undefined;

    if (shownAt.current !== null) {
      // Already painted. Cancelling the pending hide above would otherwise strand the bar
      // forever once the backstop has fired, so re-arm it: the bar can never outlive the
      // last `triggerLoader(true)` by more than SAFETY_TIMEOUT_MS.
      armSafety();
      return;
    }

    if (showTimer.current) {
      return;
    }

    showTimer.current = setTimeout(() => {
      showTimer.current = undefined;
      shownAt.current = Date.now();
      setVisible(true);
      armSafety();
    }, SHOW_DELAY_MS);
  }, [armSafety]);

  useEffect(() => {
    function loadingHandler(e: Event) {
      if ((e as CustomEvent)?.detail) {
        start();
      } else {
        stop();
      }
    }

    document.addEventListener(eventName, loadingHandler);
    return () => {
      document.removeEventListener(eventName, loadingHandler);
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
      clearTimeout(safetyTimer.current);
    };
  }, [eventName, start, stop]);

  // Navigation completed — whatever was in flight is done. Preserves the original
  // component's route-change clear, now routed through `stop` so the minimum hold applies.
  useEffect(() => {
    stop();
  }, [pathname, searchParams, stop]);

  return visible;
}
