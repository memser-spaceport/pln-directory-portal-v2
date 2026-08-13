import * as React from 'react';

// $breakpoint-lg / @include desktop in styles/media.scss — the width at which
// TeamNews.module.scss `.layout` drops its 300px rail column and the sidebar
// falls below the whole feed.
//
// A third breakpoint hook rather than reusing one of the two that exist:
// useIsNarrow is 1024 and useIsMobile is 768, and neither is where this layout
// actually changes. Matching the SCSS is the point — a hook that switches at a
// width the grid doesn't would put two copies of a module on screen at once.
const DESKTOP_BREAKPOINT = 1200;

/**
 * True below the desktop grid breakpoint.
 *
 * `undefined` until the effect runs, coerced to `false`, so SSR and the first
 * client render agree on the desktop layout and hydration is clean; the flip
 * happens on mount if the viewport is actually narrow. Same shape as
 * useIsNarrow / useIsMobile.
 */
export function useIsBelowDesktop() {
  const [isBelowDesktop, setIsBelowDesktop] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${DESKTOP_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsBelowDesktop(window.innerWidth < DESKTOP_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsBelowDesktop(window.innerWidth < DESKTOP_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isBelowDesktop;
}
