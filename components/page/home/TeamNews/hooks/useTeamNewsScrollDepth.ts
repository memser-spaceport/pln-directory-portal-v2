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
  /** Cards rendered in the list right now. A change re-measures, so a step
   *  reached after "Show All" grows the feed is still caught. */
  cardsLoaded: number;
  /** Called once per step per mount (one Home page view). */
  onStep: (step: TeamNewsScrollDepthStep, counts: TeamNewsScrollDepthCounts) => void;
}

/**
 * Scroll depth of the Home feed, counted in cards (LAB-3005): depth is the
 * number of cards the member has seen divided by the cards loaded. A card is
 * seen once its bottom edge has entered the viewport, and stays seen for as long
 * as it is mounted. Each step fires at most once per mount — "Show All" /
 * "Show Less", a scroll back up, or a tab or category change never re-fires it.
 *
 * Read-only on the DOM: one passive, rAF-throttled scroll/resize listener that
 * only measures cards not yet seen, and stops at the first card still below the
 * fold. Cards with no layout (height 0) are never counted.
 */
export function useTeamNewsScrollDepth({ listRef, cardsLoaded, onStep }: UseTeamNewsScrollDepthArgs) {
  const firedSteps = useRef<Set<TeamNewsScrollDepthStep>>(new Set());
  const seenCards = useRef<WeakSet<Element>>(new WeakSet());
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list || typeof window === 'undefined') return;
    const cards = Array.from(list.children);
    if (cards.length === 0) return;

    const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
    let cardsSeen = 0;
    let belowFold = false;
    for (const card of cards) {
      if (seenCards.current.has(card)) {
        cardsSeen += 1;
        continue;
      }
      if (belowFold) continue;
      const rect = card.getBoundingClientRect();
      if (rect.height > 0 && rect.bottom <= viewportBottom) {
        seenCards.current.add(card);
        cardsSeen += 1;
      } else {
        // Cards are stacked in order: the rest of the unseen ones are lower still.
        belowFold = true;
      }
    }

    const depth = (cardsSeen / cards.length) * 100;
    for (const step of TEAM_NEWS_SCROLL_DEPTH_STEPS) {
      if (depth >= step && !firedSteps.current.has(step)) {
        firedSteps.current.add(step);
        onStepRef.current(step, { cardsSeen, cardsLoaded: cards.length });
      }
    }
  }, [listRef]);

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
    // Capture: the Home page may scroll on body or on an inner container, and
    // scroll events do not bubble.
    const options: AddEventListenerOptions = { passive: true, capture: true };
    document.addEventListener('scroll', schedule, options);
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      document.removeEventListener('scroll', schedule, options);
      window.removeEventListener('resize', schedule);
      if (pending && frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [measure]);

  // Cards already in view on load, and cards added by "Show All".
  useEffect(() => {
    measure();
  }, [measure, cardsLoaded]);
}
