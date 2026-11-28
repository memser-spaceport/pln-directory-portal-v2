import type { PointerEvent } from 'react';

/**
 * How long the pointer has to rest on an event card before its event is prefetched. A list scrolled under the pointer
 * passes it over every card; prefetching each one got the API to answer 429 (Past has ~600 cards).
 */
export const PREFETCH_DWELL_MS = 150;

/** The one card the pointer rests on, waiting out the dwell. A pointer can be over one card at a time. */
let pending: { target: Element; timer: ReturnType<typeof setTimeout>; cancel: () => void } | null = null;

function cancelPending() {
  if (!pending) return;
  clearTimeout(pending.timer);
  pending.target.removeEventListener('pointerleave', pending.cancel);
  pending = null;
}

/**
 * The handlers that prefetch an event card's event before it is pressed: after the pointer has rested on the card for
 * `PREFETCH_DWELL_MS` (leaving the card, or entering another, cancels it; a card no longer on the page never fires),
 * and at once on keyboard focus.
 */
export function prefetchIntent(prepare: () => void) {
  return {
    onPointerEnter: (event: PointerEvent<Element>) => {
      cancelPending();
      const target = event.currentTarget;
      const cancel = () => {
        if (pending?.target === target) cancelPending();
      };
      const timer = setTimeout(() => {
        cancelPending();
        if (target.isConnected) prepare();
      }, PREFETCH_DWELL_MS);
      target.addEventListener('pointerleave', cancel);
      pending = { target, timer, cancel };
    },
    onFocus: () => prepare(),
  };
}
