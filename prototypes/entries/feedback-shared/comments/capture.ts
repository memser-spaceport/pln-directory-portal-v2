/**
 * Element screenshot for a pinned comment.
 *
 * html2canvas is loaded from the CDN on first use, the same way the vendored
 * review widget in `prototypes/comment-layer` does — it is not a dependency of
 * the app and a prototype must not add one. In production this code runs
 * *inside* the AI app (the starter kit ships it), because the host page cannot
 * paint a cross-origin frame; in this prototype the frame is `srcDoc`, so the
 * host can reach in and the capture is real.
 */

const HTML2CANVAS_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
/**
 * The picture is opened full size to look at and to mark up (`ShotEditor`), so
 * the cap is in device pixels — enough to read the element at the editor's
 * ~900px stage, and small enough that a JPEG stays around 100–250KB in the
 * session store. The thread's card still shows it as a thumbnail; that is CSS.
 */
const MAX_PX_WIDTH = 1280;

type Html2Canvas = (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;

let loading: Promise<Html2Canvas> | null = null;

function loadHtml2Canvas(): Promise<Html2Canvas> {
  const w = window as unknown as { html2canvas?: Html2Canvas };
  if (w.html2canvas) return Promise.resolve(w.html2canvas);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = HTML2CANVAS_CDN;
      script.async = true;
      script.onload = () => (w.html2canvas ? resolve(w.html2canvas) : reject(new Error('html2canvas missing')));
      script.onerror = () => reject(new Error('html2canvas failed to load'));
      document.head.appendChild(script);
    });
  }
  return loading;
}

/** Returns a JPEG data URL of the element, or null when capture is impossible. */
export async function captureElement(el: HTMLElement, ignore?: Element | null): Promise<string | null> {
  try {
    const html2canvas = await loadHtml2Canvas();
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale,
      useCORS: true,
      logging: false,
      // The comment layer's own pins and cards are not part of what was pointed at.
      ignoreElements: (node: Element) => !!ignore && (node === ignore || ignore.contains(node)),
    });
    if (canvas.width <= MAX_PX_WIDTH) return canvas.toDataURL('image/jpeg', 0.8);
    const out = document.createElement('canvas');
    const ratio = MAX_PX_WIDTH / canvas.width;
    out.width = Math.round(canvas.width * ratio);
    out.height = Math.round(canvas.height * ratio);
    out.getContext('2d')?.drawImage(canvas, 0, 0, out.width, out.height);
    return out.toDataURL('image/jpeg', 0.8);
  } catch (err) {
    console.warn('[ai-apps comments] capture failed', err);
    return null;
  }
}

const CONTROL_TAGS = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'IMG', 'SVG', 'VIDEO', 'CANVAS']);

function hasEdge(el: Element, win: Window): boolean {
  const cs = win.getComputedStyle(el);
  const bg = cs.backgroundColor;
  const painted = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
  const bordered = ['Top', 'Right', 'Bottom', 'Left'].some(
    (side) => parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0,
  );
  return painted || bordered || cs.boxShadow !== 'none' || !!cs.backgroundImage.replace('none', '');
}

/**
 * The thing a click means. The element under the cursor is usually a leaf —
 * the "3" in a stat, a word in a card — and a comment about a "3" is a comment
 * about the stat it sits in. So the pick climbs from the hit element to the
 * nearest ancestor with an edge of its own (a background, a border, a shadow)
 * or a control, and stops at the body. That is also what gets outlined on
 * hover, so what you see is what the pin will hold.
 */
export function pickTarget(hit: Element): Element {
  const doc = hit.ownerDocument;
  const win = doc.defaultView;
  if (!win) return hit;
  let el: Element | null = hit;
  while (el && el !== doc.body && el !== doc.documentElement) {
    if (CONTROL_TAGS.has(el.tagName.toUpperCase()) || hasEdge(el, win)) {
      // On a real page the nearest painted ancestor of a paragraph can be the
      // whole content column. A target that fills most of the window is not
      // "the thing I clicked"; the leaf was closer to the truth.
      const r = el.getBoundingClientRect();
      const tooBig = r.width * r.height > 0.5 * win.innerWidth * win.innerHeight;
      return tooBig && el !== hit ? hit : el;
    }
    el = el.parentElement;
  }
  // Nothing with an edge between the leaf and the body: the leaf is the answer,
  // unless the click landed on the page's bare background.
  return hit === doc.documentElement ? (doc.body ?? hit) : hit;
}

/**
 * A stable-enough CSS path (`tag:nth-of-type(n) > …`) from `body` down to the
 * element. Generated apps rarely carry ids, so structure is what there is.
 */
export function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.tagName.toLowerCase() !== 'body' && node.tagName.toLowerCase() !== 'html') {
    const tag = node.tagName.toLowerCase();
    if (node.id) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
    const index = siblings.indexOf(node) + 1;
    parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${index})` : tag);
    node = parent;
  }
  return parts.length ? `body > ${parts.join(' > ')}` : 'body';
}
