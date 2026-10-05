import { domToJpeg, domToPng } from 'modern-screenshot';

/**
 * Bundled to `public/ai-apps/bridge/v1-crop.js` and loaded by the bridge on the
 * first crop or capture only — the renderer is several times the size of the
 * bridge itself.
 *
 * Redraws the app from its DOM: ONE element (`crop`, for a pin) or the whole
 * viewport (`capture`, for the feedback form). Known gaps, by design of any DOM
 * redraw: cross-origin images without CORS come out blank, <canvas>/WebGL keep
 * only what toDataURL allows, <video> and nested iframes are empty.
 */

const MAX_EDGE = 1600;
/** Input types whose value is the author's, not something the member typed. */
const AUTHOR_VALUE_TYPES = new Set([
  'button',
  'submit',
  'reset',
  'checkbox',
  'radio',
  'range',
  'color',
  'image',
  'hidden',
]);
/** An app marks anything it never wants in a picture with this attribute (documented in the starter kit). */
const OPT_OUT_ATTR = 'data-labos-mask';
/** Set on the live page for one capture only, to find sticky/fixed elements again in the clone. */
const PLACE_ATTR = 'data-pln-bridge-place';

const mask = (value: string) => '•'.repeat(Math.min(value.length, 24));

/**
 * The picture is of what's on screen, so without this it would show whatever
 * the member typed or chose — the one thing the structured payload redacts.
 * Runs on the renderer's CLONE after it copied the live values in; the page
 * itself is never touched. A field keeps its shape so the picture still shows
 * that something was entered.
 */
function maskTypedValue(node: Node) {
  if (node instanceof HTMLInputElement && !AUTHOR_VALUE_TYPES.has(node.type)) {
    node.setAttribute('value', mask(node.getAttribute('value') ?? ''));
  } else if (node instanceof HTMLTextAreaElement) {
    const typed = node.getAttribute('value') ?? node.textContent ?? '';
    node.textContent = mask(typed);
    node.removeAttribute('value');
  } else if (node instanceof HTMLOptionElement) {
    /* A <select> shows its chosen option's text. */
    node.textContent = mask(node.textContent ?? '');
  }
}

/**
 * Masks that need the finished clone (its children are in place and its
 * styles copied — style edits made per node are overwritten by that copy):
 * editable regions lose their text, and anything the app opted out becomes a
 * flat grey box of the same size.
 */
function maskFinishedClone(root: Node) {
  if (!(root instanceof Element)) return;
  root.querySelectorAll('[contenteditable]:not([contenteditable="false"])').forEach((el) => {
    el.textContent = mask(el.textContent ?? '');
  });
  root.querySelectorAll(`[${OPT_OUT_ATTR}]`).forEach((el) => {
    if (!(el instanceof HTMLElement || el instanceof SVGElement)) return;
    el.style.setProperty('background', '#d0d5dd', 'important');
    el.style.setProperty('color', 'transparent', 'important');
    el.querySelectorAll('*').forEach((child) => {
      if (child instanceof HTMLElement || child instanceof SVGElement) {
        child.style.setProperty('visibility', 'hidden', 'important');
      }
    });
  });
}

const notBridge = (node: Node) => !(node instanceof Element && node.hasAttribute('data-pln-bridge'));

function backgroundBehind(el: Element): string {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor;
    if (color && color !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(color)) return color;
  }
  return '#ffffff';
}

/**
 * A DOM redraw lays sticky and fixed elements out where they sit in the
 * document, so a sticky header scrolls out of the picture and a fixed bar
 * lands at the top of the page. Before rendering, record where each visible
 * one is on screen; in the clone, put it back there:
 * - fixed → absolute at its page position;
 * - sticky → relative by how far it has stuck from its place in the flow,
 *   measured by switching it to `static` for an instant (synchronously, so it
 *   never paints).
 * Returns the elements it tagged, so the caller can untag them.
 */
function tagPlacedElements(): Element[] {
  const tagged: Element[] = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!(el instanceof HTMLElement)) continue;
    const position = getComputedStyle(el).position;
    if (position !== 'sticky' && position !== 'fixed') continue;
    if (el.closest('[data-pln-bridge]')) continue;
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height || box.bottom < 0 || box.top > window.innerHeight) continue;
    if (position === 'fixed') {
      el.setAttribute(
        PLACE_ATTR,
        `fixed:${Math.round(box.top + window.scrollY)}:${Math.round(box.left + window.scrollX)}`,
      );
    } else {
      const inline = el.style.getPropertyValue('position');
      const priority = el.style.getPropertyPriority('position');
      el.style.setProperty('position', 'static', 'important');
      const flow = el.getBoundingClientRect();
      if (inline) el.style.setProperty('position', inline, priority);
      else el.style.removeProperty('position');
      el.setAttribute(PLACE_ATTR, `sticky:${Math.round(box.top - flow.top)}:${Math.round(box.left - flow.left)}`);
    }
    tagged.push(el);
  }
  return tagged;
}

function placeTagged(root: Node) {
  if (!(root instanceof Element)) return;
  root.querySelectorAll(`[${PLACE_ATTR}]`).forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const [kind, a, b] = (el.getAttribute(PLACE_ATTR) ?? '').split(':');
    const set = (prop: string, value: string) => el.style.setProperty(prop, value, 'important');
    if (kind === 'fixed') {
      set('position', 'absolute');
      set('top', `${a}px`);
      set('left', `${b}px`);
      set('right', 'auto');
      set('bottom', 'auto');
    } else if (kind === 'sticky') {
      set('position', 'relative');
      set('top', `${a}px`);
      set('left', `${b}px`);
    }
    el.removeAttribute(PLACE_ATTR);
  });
}

type BridgeRenderWindow = Window & {
  __plnBridgeCrop?: (el: Element) => Promise<string>;
  __plnBridgeCapture?: () => Promise<{ dataUrl: string; width: number; height: number }>;
};

(window as BridgeRenderWindow).__plnBridgeCrop = (el) => {
  const rect = el.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 2, MAX_EDGE / Math.max(rect.width, rect.height, 1));
  return domToPng(el, {
    scale,
    backgroundColor: backgroundBehind(el),
    timeout: 8000,
    filter: notBridge,
    onCloneEachNode: maskTypedValue,
    onCloneNode: maskFinishedClone,
  });
};

/**
 * The viewport, as the member sees it. `restoreScrollPosition` applies the
 * page's scroll (and inner scroll containers'); adding a scroll transform as
 * well would shift the picture twice. JPEG keeps a full viewport far under the
 * size cap (≈ 0.5 MB at 2× on a dense dashboard, measured).
 */
(window as BridgeRenderWindow).__plnBridgeCapture = async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const tagged = tagPlacedElements();
  try {
    const dataUrl = await domToJpeg(document.documentElement, {
      width,
      height,
      scale: Math.min(window.devicePixelRatio || 1, 2),
      quality: 0.85,
      backgroundColor: backgroundBehind(document.body),
      timeout: 8000,
      features: { restoreScrollPosition: true },
      filter: notBridge,
      onCloneEachNode: maskTypedValue,
      onCloneNode: (root) => {
        placeTagged(root);
        maskFinishedClone(root);
      },
    });
    return { dataUrl, width, height };
  } finally {
    tagged.forEach((el) => el.removeAttribute(PLACE_ATTR));
  }
};
