'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

import { computeStreamCut, STREAM_CUT_MIN_STACKED, STREAM_SIDE_BY_SIDE_QUERY, type StreamCut } from './streamCut';

/**
 * How many cards of `listRef` fit beside `columnRef`.
 *
 * The news list paints before the sidebar finishes (deals, teams to follow, images). A box-only measure then
 * locks the list to that short height. The content height (`scrollHeight`) is the sidebar the reader sees, and a
 * mutation on the sidebar measures again when those sections arrive.
 */
export function useColumnCut(
  listRef: RefObject<HTMLElement | null>,
  columnRef: RefObject<HTMLElement | null>,
  contentKey: string,
): StreamCut {
  const [fit, setFit] = useState<StreamCut>({ full: STREAM_CUT_MIN_STACKED });

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const column = columnRef.current;
      if (!column) return;
      const beside = window.matchMedia?.(STREAM_SIDE_BY_SIDE_QUERY).matches ?? false;
      let target: number | null = null;
      if (column && beside) {
        const columnBox = column.getBoundingClientRect();
        const listTop = list.getBoundingClientRect().top;
        const boxBottom = columnBox.bottom - listTop;
        const contentBottom = columnBox.top + column.scrollHeight - listTop;
        const nextTarget = Math.max(boxBottom, contentBottom);
        // A zero box is the column before it has laid out. Keep the previous cut.
        if (nextTarget <= 0) return;
        target = nextTarget;
      }
      const next = computeStreamCut(Array.from(list.children) as HTMLElement[], target);
      setFit((prev) => (prev.full === next.full && prev.clip === next.clip ? prev : next));
    };

    const ro = new ResizeObserver(measure);
    ro.observe(list);
    const column = columnRef.current;
    if (column) ro.observe(column);
    const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(measure);
    if (column && mo) mo.observe(column, { childList: true, subtree: true });
    window.addEventListener('resize', measure);
    // contentKey changes when the sidebar's sections arrive. Measure in this commit, then again
    // after the next frame so images that resolve in that frame are included.
    measure();
    const frame = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mo?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [listRef, columnRef, contentKey]);

  return fit;
}
