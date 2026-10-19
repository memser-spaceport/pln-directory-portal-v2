'use client';

import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Animates a list of numbers from their previous values to `target` whenever `target` changes.
 * The first render shows `target` as is (nothing to animate from, and the server render matches).
 * A change in length, or reduced motion, jumps straight to `target`.
 */
export function useTweenedValues(target: number[], duration = 450): number[] {
  const [values, setValues] = useState(target);
  const current = useRef(target);
  const key = target.join(',');

  useEffect(() => {
    const from = current.current;
    if (from.length !== target.length || prefersReducedMotion()) {
      current.current = target;
      setValues(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = easeOutCubic(Math.min((now - start) / duration, 1));
      const next = target.map((to, i) => from[i] + (to - from[i]) * progress);
      current.current = next;
      setValues(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `key` captures the target's contents; the array itself is new on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, duration]);

  return values;
}
