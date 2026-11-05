'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';

export type TeamNewsScrollDepthStep = 50 | 70 | 90;

export const TEAM_NEWS_SCROLL_DEPTH_STEPS: readonly TeamNewsScrollDepthStep[] = [50, 70, 90];

export interface TeamNewsScrollDepthCounts {
  cardsSeen: number;
  cardsLoaded: number;
}

interface UseTeamNewsScrollDepthArgs {
  /** The feed list element; each direct child is one card. */
  listRef: RefObject<HTMLElement | null>;
  /** Cards rendered in the list. When it grows ("Show All"), the hook measures
   *  again at once, so a step reached by the new cards is still caught. */
  cardsLoaded: number;
  /** Called once per step per mount (one Home page view). */
  onStep: (step: TeamNewsScrollDepthStep, counts: TeamNewsScrollDepthCounts) => void;
}

/**
 * Scroll depth of the Home feed, counted in cards (LAB-3005): depth is the
 * number of cards the member has seen divided by the cards loaded. A card is
 * seen once its bottom edge has been in the viewport — or once it has moved
 * from in or below the viewport to above it between two measures (a fast fling
 * or a jump to the end) — and
 * stays seen while it is mounted. Each step fires at most once per mount:
 * "Show All" / "Show Less", a scroll back up, or a tab or category change never
 * fires it again.
 *
 * "Show Less" does not shrink the denominator: while any card of the list stays
 * mounted, the largest card count of that list is used, so cutting a long feed
 * back to its first cards cannot fire the higher steps. A tab or category change
 * remounts every card; the new list starts with its own count.
 *
 * Read-only on the DOM: one passive, rAF-throttled listener for page scroll and
 * resize. Scrolls inside other elements (rails, modals, text areas) are ignored.
 * On mount the hook only notes where the cards are; it counts none as seen,
 * because cards are not at their final height before images load. The first
 * scroll or resize counts them.
 */
export function useTeamNewsScrollDepth({ listRef, cardsLoaded, onStep }: UseTeamNewsScrollDepthArgs) {
  const firedSteps = useRef<Set<TeamNewsScrollDepthStep>>(new Set());
  const seenCards = useRef<WeakSet<Element>>(new WeakSet());
  // Cards whose bottom edge was in or below the viewport at some measure.
  const notAboveCards = useRef<WeakSet<Element>>(new WeakSet());
  const knownCards = useRef<WeakSet<Element>>(new WeakSet());
  const maxLoaded = useRef(0);
  const onStepRef = useRef(onStep);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  const measure = useCallback(
    (registerOnly = false) => {
      const list = listRef.current;
      if (!list || typeof window === 'undefined') return;
      const cards = Array.from(list.children);
      if (cards.length === 0) return;

      const isSameList = cards.some((card) => knownCards.current.has(card));
      maxLoaded.current = isSameList ? Math.max(maxLoaded.current, cards.length) : cards.length;

      const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
      let cardsSeen = 0;
      for (const card of cards) {
        knownCards.current.add(card);
        if (seenCards.current.has(card)) {
          cardsSeen += 1;
          continue;
        }
        const rect = card.getBoundingClientRect();
        if (rect.height <= 0) continue;
        const bottomInView = rect.bottom >= 0 && rect.bottom <= viewportBottom;
        const passedThrough = rect.bottom < 0 && notAboveCards.current.has(card);
        if (rect.bottom >= 0) notAboveCards.current.add(card);
        if (!registerOnly && (bottomInView || passedThrough)) {
          seenCards.current.add(card);
          cardsSeen += 1;
        }
      }
      if (registerOnly) return;

      const depth = (cardsSeen / maxLoaded.current) * 100;
      for (const step of TEAM_NEWS_SCROLL_DEPTH_STEPS) {
        if (depth >= step && !firedSteps.current.has(step)) {
          firedSteps.current.add(step);
          onStepRef.current(step, { cardsSeen, cardsLoaded: maxLoaded.current });
        }
      }
    },
    [listRef],
  );

  useEffect(() => {
    let pending = false;
    let frame: number | null = null;
    const schedule = () => {
      if (pending) return;
      pending = true;
      frame = window.requestAnimationFrame(() => {
        pending = false;
        frame = null;
        measure();
      });
    };
    const mountFrame = window.requestAnimationFrame(() => measure(true));
    // Capture: scroll events do not bubble, and the page may scroll on body or
    // on a container around the feed. Only those scrolls move the feed.
    const onScroll = (event: Event) => {
      const target = event.target;
      const list = listRef.current;
      if (
        target === document ||
        target === document.documentElement ||
        target === document.body ||
        (list && target instanceof Node && target.contains(list))
      ) {
        schedule();
      }
    };
    const options: AddEventListenerOptions = { passive: true, capture: true };
    document.addEventListener('scroll', onScroll, options);
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      document.removeEventListener('scroll', onScroll, options);
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(mountFrame);
      if (pending && frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [measure, listRef]);

  // Cards added by "Show All" can already be in view. Skip the mount: cards are
  // not at their final height before images load.
  const lastLoaded = useRef(cardsLoaded);
  useEffect(() => {
    if (cardsLoaded > lastLoaded.current) measure();
    lastLoaded.current = cardsLoaded;
  }, [measure, cardsLoaded]);
}
