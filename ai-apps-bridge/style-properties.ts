/**
 * The computed style properties the renderer copies onto each cloned node.
 *
 * Left alone, modern-screenshot copies every enumerated property: the ~400
 * standard ones and, since Chrome 141 (Firefox and Safari always did), every
 * CSS custom property an element inherits. A custom property never matches
 * the renderer's default, so a theme of 300 variables is written onto every
 * node — most of a capture's time, and a picture several MB large. None of
 * them paints anything by itself; the standard properties they feed are
 * already resolved.
 */

/** Properties that never change how a node paints in a still picture. */
const NOT_PAINTED =
  /^(animation|transition|scroll-|overscroll-|touch-action|pointer-events|cursor$|user-select|-webkit-user-|will-change|view-transition|anchor-|position-try|position-anchor|position-area|position-visibility|scroll-timeline|view-timeline|timeline-scope|interpolate-size|reading-|speak|-webkit-tap-highlight|-webkit-locale|-webkit-print|print-color|page|orphans|widows|break-|app-region|-webkit-app-region|caret-|color-rendering|math-|ruby-|hyphenate-|navigation|overflow-anchor|forced-color|text-autospace|-webkit-highlight)/;

export function paintedStyleProperties(win: Window = window): string[] {
  return Array.from(win.getComputedStyle(win.document.documentElement)).filter(
    (name) => !name.startsWith('--') && !NOT_PAINTED.test(name),
  );
}
