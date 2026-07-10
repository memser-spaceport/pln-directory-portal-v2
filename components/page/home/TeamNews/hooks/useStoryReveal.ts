import { useCallback, useEffect, useRef } from 'react';

import styles from '../components/NewsGroupCard/NewsGroupCard.module.scss';

// Must match .storyHighlighted's animation duration in NewsGroupCard.module.scss.
const HIGHLIGHT_DURATION_MS = 2000;

// Scroll a revealed story row into view, briefly highlight it, and move
// keyboard focus to it. Kept as a plain imperative call (not an effect keyed
// on external state) so there's no reactive loop for a "reveal complete"
// state change to retrigger against — see docs/plans/2026-07-10-feat-team-news-popular-scroll-to-story-plan.md
// for why an earlier effect-based design self-cleared its own highlight.
export function useStoryReveal() {
  const pendingRef = useRef<{ el: HTMLElement; timeoutId: ReturnType<typeof setTimeout> } | null>(null);

  const clear = useCallback(() => {
    if (!pendingRef.current) return;
    clearTimeout(pendingRef.current.timeoutId);
    pendingRef.current.el.classList.remove(styles.storyHighlighted);
    pendingRef.current = null;
  }, []);

  const reveal = useCallback(
    (el: HTMLElement) => {
      clear(); // supersede any still-active highlight from a prior click
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      el.classList.add(styles.storyHighlighted);
      el.focus({ preventScroll: true });
      const timeoutId = setTimeout(() => {
        el.classList.remove(styles.storyHighlighted);
        pendingRef.current = null;
      }, HIGHLIGHT_DURATION_MS);
      pendingRef.current = { el, timeoutId };
    },
    [clear],
  );

  useEffect(() => clear, [clear]); // clear a still-pending highlight on unmount too, not just on the next reveal

  return reveal;
}
