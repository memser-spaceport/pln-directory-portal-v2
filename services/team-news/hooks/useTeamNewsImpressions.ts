'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { recordTeamNewsImpressions, sendTeamNewsImpressionsBeacon } from '../team-news.service';

const FLUSH_DELAY_MS = 1000;
const FLUSH_SIZE_THRESHOLD = 50;

/** Shared initial value, so a fresh mount doesn't hand callers a new identity. */
const EMPTY_VIEWED: ReadonlySet<string> = new Set();

/**
 * Owns view-impression recording for one page load: cards report visibility
 * via `recordVisible(uid)`, which dedupes, queues, and flushes batched POSTs.
 * In-memory only — never persisted — so a revisit/refresh can record fresh
 * impressions (see the brainstorm's "rises on revisit" scenario).
 *
 * Also reports back WHAT IT RECORDED, as `viewedUids`, so a surface can show
 * the increment it just caused instead of the number the page arrived with —
 * the count moved on the server the moment a card was seen, and without this
 * the reader had to reload to find out.
 */
export function useTeamNewsImpressions() {
  const recordedRef = useRef<Set<string>>(new Set());
  /**
   * A render-visible MIRROR of `recordedRef`, not a second record of it.
   *
   * The ref is what dedupes and what decides whether a uid is queued, and it
   * stays that way — mutating a ref just doesn't re-render, so nothing could
   * ever show what it holds. This is written in the same synchronous branch,
   * after the ref has already decided, so the two cannot describe different
   * sets: it is a projection, not an opinion.
   *
   * Not the other way around (state as the authority, ref deleted): the dedupe
   * check would then read a closed-over state value from inside a callback that
   * has to stay identity-stable, which means either a stale read or
   * `viewedUids` in `recordVisible`'s deps — and `useCardVisibilityTracking`
   * lists its callback in the effect deps, so every card's observer would be
   * torn down and rebuilt every time any card was seen.
   */
  const [viewedUids, setViewedUids] = useState<ReadonlySet<string>>(EMPTY_VIEWED);
  const queueRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (queueRef.current.length === 0) return;
    const uids = queueRef.current;
    queueRef.current = [];
    // Best-effort: no retry on failure. This is a "was it seen" signal, not
    // a critical write — a dropped batch just under-counts, same tolerance
    // the raw, non-deduplicated backend counter already accepts.
    recordTeamNewsImpressions(uids).catch(() => {});
  }, []);

  const recordVisible = useCallback(
    (uid: string) => {
      // Dedup lives solely in recordedRef — once a uid is added here it's
      // also pushed to queueRef in the same call, so there's no separate
      // queue-membership check to make.
      if (recordedRef.current.has(uid)) return;
      recordedRef.current.add(uid);
      queueRef.current.push(uid);
      // The mirror. Same branch, after the decision — see the note above. The
      // updater is idempotent, so a double-invoked render pass can't add twice.
      setViewedUids((prev) => (prev.has(uid) ? prev : new Set(prev).add(uid)));

      // Size-or-time flush: bounds payload growth during a fast scroll, not
      // just latency.
      if (queueRef.current.length >= FLUSH_SIZE_THRESHOLD) {
        flush();
        return;
      }
      // Fixed-delay batching window: the first visible card in a burst starts
      // the timer; everything that becomes visible before it fires joins the
      // same batch. Not reset per-arrival — a reset would let continuous
      // scrolling postpone the flush indefinitely.
      if (!timerRef.current) {
        timerRef.current = setTimeout(flush, FLUSH_DELAY_MS);
      }
    },
    [flush],
  );

  // Leave-flush: fires on an actual tab hide/close (visibilitychange), not
  // just SPA-internal unmount, via sendBeacon — a plain fetch here can be
  // aborted mid-flight when the tab really closes; sendBeacon is built to
  // survive it.
  useEffect(() => {
    const flushViaBeacon = () => {
      if (queueRef.current.length === 0) return;
      const sent = sendTeamNewsImpressionsBeacon(queueRef.current);
      if (sent) queueRef.current = [];
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushViaBeacon();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushViaBeacon(); // SPA-internal unmount: best-effort, same tolerance as above
    };
  }, []);

  return { recordVisible, viewedUids };
}
