import * as React from 'react';

// $breakpoint-md / @include media.tablet-landscape in styles/media.scss — the
// width at which the member profile's right rail (`.desktopOnly`) appears and
// the page goes two-column.
//
// A fourth breakpoint hook rather than reusing one of the three that exist:
// useIsMobile is 768, useIsNarrow 1024, useIsBelowDesktop 1200, and none of them
// is where this layout changes. Matching the SCSS is the point — a hook that
// switched at a width the grid doesn't would put two copies of the news card on
// screen at once, and two copies means duplicate data-story-uid nodes, which is
// exactly what NewsDetailModal's focus restore resolves by querySelector.
const TABLET_LANDSCAPE_BREAKPOINT = 960;

/**
 * True below the two-column breakpoint, i.e. when the right rail is hidden.
 *
 * `undefined` until the effect runs, coerced to `false`, so SSR and the first
 * client render agree on the rail layout and hydration is clean; the flip
 * happens on mount if the viewport is actually narrow. Same shape as
 * useIsMobile / useIsNarrow / useIsBelowDesktop.
 */
export function useIsBelowTabletLandscape() {
  const [isBelow, setIsBelow] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TABLET_LANDSCAPE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsBelow(window.innerWidth < TABLET_LANDSCAPE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsBelow(window.innerWidth < TABLET_LANDSCAPE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isBelow;
}
