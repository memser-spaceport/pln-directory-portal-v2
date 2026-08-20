/**
 * Layout for the whole `/design-canvas` subtree — the index and every
 * `/design-canvas/<slug>`.
 *
 * One job: load the canvas's compiled Tailwind. It is imported here rather than
 * in a page so both routes get it, and it is a pre-built file rather than a
 * PostCSS pass so the app's own stylesheet pipeline is untouched — see
 * canvas.tailwind.css.
 *
 * THE APP CHROME IS DROPPED ELSEWHERE, in `AppChromeGate`, which the root layout
 * wraps around the header and the mobile bar. This layout cannot do it: the
 * header is rendered by a parent, and a child layout has no way to remove a
 * sibling its parent drew. An earlier version hid both with a `:has()` rule from
 * a stylesheet here, copied from the prototypes' own trick — that made the page
 * look right and left the elements in the DOM, which `check-canvas.mjs` reads
 * with `querySelectorAll` and correctly called an app shell around the canvas.
 *
 * DELETE WITH: the `design-canvas/` folder.
 */
import './canvas.generated.css';

export default function DesignCanvasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
