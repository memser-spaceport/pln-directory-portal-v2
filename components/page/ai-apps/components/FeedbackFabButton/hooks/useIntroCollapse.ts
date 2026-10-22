import { useEffect, useRef, useState } from 'react';

/** How long the label stays before the pill settles to the glyph. */
const INTRO_MS = 2200;

export function useIntroCollapse(isPaused: boolean) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const introStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    introStartedAtRef.current = Date.now();
  }, []);

  // Paused while the feedback drawer is open: the label is spent on arrival, not behind the drawer.
  useEffect(() => {
    if (isPaused || isCollapsed) {
      return;
    }

    const elapsed = introStartedAtRef.current ? Date.now() - introStartedAtRef.current : 0;
    const remaining = Math.max(0, INTRO_MS - elapsed);

    const timer = setTimeout(() => setIsCollapsed(true), remaining);
    return () => clearTimeout(timer);
  }, [isPaused, isCollapsed]);

  return isCollapsed;
}
