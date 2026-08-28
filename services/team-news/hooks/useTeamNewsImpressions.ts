'use client';

import { useCallback, useEffect, useRef } from 'react';
import { recordTeamNewsImpressions, sendTeamNewsImpressionsBeacon } from '../team-news.service';

const FLUSH_DELAY_MS = 1000;
const FLUSH_SIZE_THRESHOLD = 50;

/**
 * Owns view-impression recording for one page load: cards report visibility
 * via `recordVisible(uid)`, which dedupes, queues, and flushes batched POSTs.
 * In-memory only — never persisted — so a revisit/refresh can record fresh
 * impressions (see the brainstorm's "rises on revisit" scenario).
 */
export function useTeamNewsImpressions() {
  const recordedRef = useRef<Set<string>>(new Set());
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

  return { recordVisible };
}
