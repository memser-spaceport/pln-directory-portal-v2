'use client';

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

import { computeStreamCut, STREAM_CUT_MIN_STACKED, STREAM_SIDE_BY_SIDE_QUERY, type StreamCut } from './streamCut';

/** The divider between a short tab and the All stories under it. Not a card, so the cut skips it. */
const FEED_SKIP_ATTR = 'data-feed-skip';

export interface ColumnFit extends StreamCut {
  /**
   * The first `primaryCount` cards already reach the rail. True when the rail is not beside the list, or when
   * there is no primary split. A short filtered tab uses this to decide whether to append other news.
   */
  primaryReaches: boolean;
  /** Same value as `primaryReaches`, updated during measure before the state commit. */
  reachesRef: RefObject<boolean>;
}

/**
 * How many cards of `listRef` fit beside `columnRef`.
 *
 * The news list paints before the sidebar finishes (deals, teams to follow, images). A box-only measure then
 * locks the list to that short height. The content height (`scrollHeight`) is the sidebar the reader sees, and a
 * mutation on the sidebar measures again when those sections arrive.
 *
 * `primaryCount` is the tab's own cards at the head of the list. The cut still measures every card. Children
 * marked `data-feed-skip` (the Other news divider) are not cards.
 */
export function useColumnCut(
  listRef: RefObject<HTMLElement | null>,
  columnRef: RefObject<HTMLElement | null>,
  contentKey: string,
  primaryCount?: number,
): ColumnFit {
  const [fit, setFit] = useState<StreamCut & { primaryReaches: boolean }>({
    full: STREAM_CUT_MIN_STACKED,
    primaryReaches: true,
  });
  // Written in measure(), before setState, so a layout effect in the caller can read this commit's result.
  const reachesRef = useRef(true);

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
      const cards = (Array.from(list.children) as HTMLElement[]).filter((el) => !el.hasAttribute(FEED_SKIP_ATTR));
      const next = computeStreamCut(cards, target);
      let primaryReaches = true;
      if (beside && target !== null && primaryCount && primaryCount > 0) {
        const lastPrimary = cards[Math.min(primaryCount, cards.length) - 1];
        if (lastPrimary) primaryReaches = lastPrimary.offsetTop + lastPrimary.offsetHeight >= target;
      }
      reachesRef.current = primaryReaches;
      setFit((prev) =>
        prev.full === next.full && prev.clip === next.clip && prev.primaryReaches === primaryReaches
          ? prev
          : { ...next, primaryReaches },
      );
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
  }, [listRef, columnRef, contentKey, primaryCount]);

  return { ...fit, reachesRef };
}
