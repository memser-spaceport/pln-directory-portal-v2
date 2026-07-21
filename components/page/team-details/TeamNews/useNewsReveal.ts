import { useCallback, useEffect, useRef } from 'react';

// Must match the newsHighlightRing animation duration in TeamNewsRail.module.scss.
export const NEWS_HIGHLIGHT_DURATION_MS = 1500;

/**
 * Scroll a news card into view inside the all-news modal and flash it. Kept as
 * a plain imperative call (not an effect keyed on external state) so there's no
 * reactive loop for a "reveal complete" state change to retrigger against —
 * same rationale as the homepage's useStoryReveal (see its header comment and
 * docs/plans/2026-07-10-feat-team-news-popular-scroll-to-story-plan.md).
 *
 * Differences from useStoryReveal, both deliberate:
 * - Scrolls the passed container (instant, centered) instead of
 *   el.scrollIntoView — scrollIntoView also scrolls the page behind the modal
 *   and the rail's own scroll area (see PRs #2641/#2642). offsetTop-based math
 *   also stays correct mid framer-motion transform, unlike client rects; the
 *   container must be the card's offsetParent (.modalBody is position:
 *   relative, .newsPage is position: fixed).
 * - Toggles a data-highlighted attribute instead of a class: React never
 *   rewrites attributes it doesn't render, so a mid-ring card re-render
 *   (upvote) can't wipe the highlight the way a className rewrite would.
 */
export function useNewsReveal() {
  const pendingRef = useRef<{ el: HTMLElement; timeoutId: ReturnType<typeof setTimeout> } | null>(null);

  const clear = useCallback(() => {
    if (!pendingRef.current) return;
    clearTimeout(pendingRef.current.timeoutId);
    delete pendingRef.current.el.dataset.highlighted;
    pendingRef.current = null;
  }, []);

  const reveal = useCallback(
    (el: HTMLElement, container: HTMLElement) => {
      clear(); // supersede any still-active highlight from a prior reveal
      container.scrollTo({ top: el.offsetTop - (container.clientHeight - el.offsetHeight) / 2 });
      el.dataset.highlighted = 'true';
      el.focus({ preventScroll: true });
      const timeoutId = setTimeout(() => {
        delete el.dataset.highlighted;
        pendingRef.current = null;
      }, NEWS_HIGHLIGHT_DURATION_MS);
      pendingRef.current = { el, timeoutId };
    },
    [clear],
  );

  useEffect(() => clear, [clear]); // clear a still-pending highlight on unmount too, not just on the next reveal

  return reveal;
}
