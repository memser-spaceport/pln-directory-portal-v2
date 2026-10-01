/**
 * What a click on the app means. Ported from the designer prototype
 * (`prototypes/entries/feedback-shared/comments/capture.ts`, `pickTarget`):
 * the element under the cursor is usually a leaf — the "3" in a stat, a word in
 * a card — and a comment about a "3" is a comment about the stat it sits in.
 * So the target climbs from the hit element to the nearest control or the
 * nearest ancestor with an edge of its own (a background, a border, a shadow,
 * a background image), and stops at the body. That is also what the bridge
 * outlines on hover, so what the member sees is what the pin will hold.
 */

const CONTROL_TAGS = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'IMG', 'SVG', 'VIDEO', 'CANVAS']);

function hasEdge(el: Element, win: Window): boolean {
  const cs = win.getComputedStyle(el);
  const bg = cs.backgroundColor;
  const painted = !!bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
  const bordered = ['top', 'right', 'bottom', 'left'].some(
    (side) => parseFloat(cs.getPropertyValue(`border-${side}-width`)) > 0,
  );
  const shadow = !!cs.boxShadow && cs.boxShadow !== 'none';
  const image = !!cs.backgroundImage && cs.backgroundImage !== 'none';
  return painted || bordered || shadow || image;
}

export function pickTarget(hit: Element, win: Window): Element {
  const doc = hit.ownerDocument;
  let el: Element | null = hit;
  while (el && el !== doc.body && el !== doc.documentElement) {
    if (CONTROL_TAGS.has(el.tagName.toUpperCase()) || hasEdge(el, win)) {
      /* On a real page the nearest painted ancestor of a paragraph can be the
         whole content column. A target that fills most of the window is not
         "the thing I clicked"; the leaf was closer to the truth. */
      const r = el.getBoundingClientRect();
      const tooBig = r.width * r.height > 0.5 * win.innerWidth * win.innerHeight;
      return tooBig && el !== hit ? hit : el;
    }
    el = el.parentElement;
  }
  /* Nothing with an edge between the leaf and the body: the leaf is the answer,
     unless the click landed on the page's bare background. */
  return hit === doc.documentElement ? (doc.body ?? hit) : hit;
}

/**
 * Where in the element the click landed, as a fraction of its box (0–1), so a
 * pin can sit on that spot and follow the element. A box with no size gives its
 * centre.
 */
export function pointWithin(el: Element, clientX: number, clientY: number): { ox: number; oy: number } {
  const r = el.getBoundingClientRect();
  const frac = (offset: number, size: number) =>
    size > 0 ? Math.round(Math.min(1, Math.max(0, offset / size)) * 1000) / 1000 : 0.5;
  return { ox: frac(clientX - r.left, r.width), oy: frac(clientY - r.top, r.height) };
}
