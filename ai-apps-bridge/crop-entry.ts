import { createContext, destroyContext, domToJpeg, domToPng, type Context } from 'modern-screenshot';
import { CAPTURE_TOO_SLOW } from './protocol';

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
/** Set on the live page for one capture only: an off-screen element drawn as an empty box. */
const SHELL_ATTR = 'data-pln-bridge-shell';
/** Past this, a viewport capture gives up (CAPTURE_TOO_SLOW) instead of holding the page's thread. */
const CAPTURE_BUDGET_MS = 5000;
/** How long the render runs before letting the page paint. */
const SLICE_MS = 8;
/** Safari/Firefox redraws of the finished picture, so late-decoding images still land. */
const DRAW_RETRY_CAP = 3;

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

const isOnScreen = (box: DOMRect) =>
  box.width > 0 &&
  box.height > 0 &&
  box.bottom > 0 &&
  box.right > 0 &&
  box.top < window.innerHeight &&
  box.left < window.innerWidth;

/**
 * Every element with a box on screen, plus all its ancestors — so a fixed
 * modal declared inside an off-screen container, or a child translated into
 * view, keeps the chain that leads to it. Read-only: layout is clean, so the
 * rects cost no reflow.
 */
function markOnScreen(): Set<Element> {
  const onScreen = new Set<Element>([document.documentElement]);
  if (document.body) onScreen.add(document.body);
  for (const el of document.querySelectorAll('body *')) {
    if (!isOnScreen(el.getBoundingClientRect())) continue;
    for (let node: Element | null = el; node && !onScreen.has(node); node = node.parentElement) onScreen.add(node);
  }
  return onScreen;
}

/**
 * Whether an off-screen element can be drawn as an empty box. The renderer
 * copies every element's used width and height, so a box kept without its
 * children still takes the room it took, and nothing on screen moves. Not
 * inline content (dropping it re-wraps the lines around it), not
 * `display: contents` (it has no box), not the inside of a drawing, and not an
 * <svg> holding ids another drawing may point at with `url(#…)`.
 */
function canShell(el: Element): boolean {
  if (el instanceof SVGElement) return el instanceof SVGSVGElement && !el.querySelector('[id]');
  const display = getComputedStyle(el).display;
  return display !== 'inline' && display !== 'contents';
}

/** The outermost off-screen elements that can be drawn empty — all a capture has to skip. */
function findShells(onScreen: Set<Element>): Set<Element> {
  const shells = new Set<Element>();
  const visit = (parent: Element) => {
    for (const child of parent.children) {
      if (!onScreen.has(child) && canShell(child)) shells.add(child);
      else visit(child);
    }
  };
  visit(document.documentElement);
  return shells;
}

/**
 * An empty box keeps its copied size, but a flex or grid item's automatic
 * minimum is its content's, and the content is gone: hold it at the size it had.
 */
function pinShells(root: Node) {
  if (!(root instanceof Element)) return;
  root.querySelectorAll(`[${SHELL_ATTR}]`).forEach((el) => {
    el.removeAttribute(SHELL_ATTR);
    if (!(el instanceof HTMLElement)) return;
    const { width, height } = el.style;
    el.style.setProperty('flex', '0 0 auto', 'important');
    if (width.endsWith('px')) el.style.setProperty('min-width', width, 'important');
    if (height.endsWith('px')) el.style.setProperty('min-height', height, 'important');
  });
}

/**
 * A DOM redraw lays sticky and fixed elements out where they sit in the
 * document, so a sticky header scrolls out of the picture and a fixed bar
 * lands at the top of the page. Before rendering, record where each visible
 * one is on screen; in the clone, put it back there:
 * - fixed → absolute at its page position;
 * - sticky → relative by how far it has stuck from its place in the flow,
 *   measured by switching it to `static` for an instant (synchronously, so it
 *   never paints). All of one nesting level switch together — one reflow per
 *   level, not per element; a sticky inside a sticky is measured after its
 *   ancestor is back, or its offset would include the ancestor's.
 * Returns the elements it tagged, so the caller can untag them.
 */
function tagPlacedElements(onScreen: Set<Element>): Element[] {
  const tagged: Element[] = [];
  const sticky: Array<{ el: HTMLElement; box: DOMRect }> = [];
  for (const el of onScreen) {
    if (!(el instanceof HTMLElement) || el === document.documentElement || el === document.body) continue;
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
      tagged.push(el);
    } else {
      sticky.push({ el, box });
    }
  }

  const stuck = new Set<Element>(sticky.map(({ el }) => el));
  const levels: Array<typeof sticky> = [];
  for (const item of sticky) {
    let level = 0;
    for (let node = item.el.parentElement; node; node = node.parentElement) if (stuck.has(node)) level += 1;
    (levels[level] ??= []).push(item);
  }
  for (const level of levels) {
    if (!level) continue;
    const inline = level.map(({ el }) => [
      el.style.getPropertyValue('position'),
      el.style.getPropertyPriority('position'),
    ]);
    level.forEach(({ el }) => el.style.setProperty('position', 'static', 'important'));
    const flows = level.map(({ el }) => el.getBoundingClientRect());
    level.forEach(({ el }, i) => {
      const [value, priority] = inline[i];
      if (value) el.style.setProperty('position', value, priority);
      else el.style.removeProperty('position');
    });
    level.forEach(({ el, box }, i) => {
      el.setAttribute(
        PLACE_ATTR,
        `sticky:${Math.round(box.top - flows[i].top)}:${Math.round(box.left - flows[i].left)}`,
      );
      tagged.push(el);
    });
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

/** Lets the page — and LabOS, which shares its thread — paint between slices of the render. */
function nextTask(): Promise<void> {
  const { scheduler } = window as Window & { scheduler?: { yield?: () => Promise<void> } };
  if (typeof scheduler?.yield === 'function') return scheduler.yield();
  if (typeof MessageChannel === 'function') {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(null);
    });
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

type CaptureResult = { dataUrl: string; width: number; height: number };

type BridgeRenderWindow = Window & {
  __plnBridgeCrop?: (el: Element) => Promise<string>;
  __plnBridgeCapture?: () => Promise<CaptureResult>;
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
 *
 * Only what is on screen is drawn in full: off-screen subtrees stay as empty
 * boxes, so the cost follows the viewport, not the page. The render yields
 * every few ms and gives up with CAPTURE_TOO_SLOW past CAPTURE_BUDGET_MS rather than
 * hold the thread.
 *
 * Leans on three modern-screenshot 4.7.0 internals, hence the exact version in
 * package.json: every element gets its used width/height inline (so an empty
 * box keeps its room), `onCloneEachNode` is awaited per node (so it can
 * yield), and `onEmbedNode` runs before the redraw count is read.
 */
async function captureViewport(): Promise<CaptureResult> {
  const startedAt = performance.now();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const onScreen = markOnScreen();
  const tagged = tagPlacedElements(onScreen);
  const shells = findShells(onScreen);
  shells.forEach((el) => el.setAttribute(SHELL_ATTR, ''));
  let sliceStartedAt = performance.now();
  const checkBudget = () => {
    if (performance.now() - startedAt > CAPTURE_BUDGET_MS) throw new Error(CAPTURE_TOO_SLOW);
  };
  let context: Context<HTMLElement> | undefined;
  try {
    context = await createContext(document.documentElement, {
      type: 'image/jpeg',
      width,
      height,
      scale: Math.min(window.devicePixelRatio || 1, 2),
      quality: 0.85,
      backgroundColor: backgroundBehind(document.body),
      timeout: 8000,
      features: { restoreScrollPosition: true },
      filter: (node) => {
        if (!notBridge(node)) return false;
        const parent = node.parentNode instanceof ShadowRoot ? node.parentNode.host : node.parentNode;
        return !(parent instanceof Element && shells.has(parent));
      },
      onCloneEachNode: async (node) => {
        maskTypedValue(node);
        if (performance.now() - sliceStartedAt < SLICE_MS) return;
        checkBudget();
        await nextTask();
        sliceStartedAt = performance.now();
      },
      onCloneNode: (root) => {
        placeTagged(root);
        pinShells(root);
        maskFinishedClone(root);
      },
      onEmbedNode: () => {
        checkBudget();
        /* Safari and Firefox redraw the picture once per embedded image — each a full layout of it. */
        if (context) context.drawImageCount = Math.min(context.drawImageCount, DRAW_RETRY_CAP);
      },
    });
    const dataUrl = await domToJpeg(context);
    return { dataUrl, width, height };
  } finally {
    if (context) destroyContext(context);
    tagged.forEach((el) => el.removeAttribute(PLACE_ATTR));
    shells.forEach((el) => el.removeAttribute(SHELL_ATTR));
  }
}

/* A capture already under way answers a second request too: one render, not two. */
let running: Promise<CaptureResult> | null = null;
(window as BridgeRenderWindow).__plnBridgeCapture = () => {
  running ??= captureViewport().finally(() => {
    running = null;
  });
  return running;
};
