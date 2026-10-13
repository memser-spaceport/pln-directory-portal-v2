import { createContext, destroyContext, domToJpeg, domToPng, type Context } from 'modern-screenshot';

import { ensureFontCache } from './font-cache';
import { paintedStyleProperties } from './style-properties';
import { withViewportShot } from './viewport-shot-cache';
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
/** Set on a block fully above the viewport: the box stays, its contents are not drawn. */
const SHELL_ATTR = 'data-pln-bridge-shell';
/**
 * A fully off-screen block with at most this many element children is still opened,
 * so a fixed or sticky element nested a few wrappers deep is still found.
 * A long list below the fold is not.
 */
const FOLLOW_CHILD_LIMIT = 32;
/** Past this, embedding the picture gives up (CAPTURE_TOO_SLOW). The clone itself is not paused. */
const CAPTURE_BUDGET_MS = 5000;
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

const BLOCK_TAGS = new Set([
  'DIV',
  'SECTION',
  'MAIN',
  'ARTICLE',
  'ASIDE',
  'NAV',
  'HEADER',
  'FOOTER',
  'UL',
  'OL',
  'LI',
  'TABLE',
  'TBODY',
  'THEAD',
  'TFOOT',
  'TR',
  'P',
  'FIGURE',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'DETAILS',
  'FIELDSET',
]);

/** A block can be drawn as an empty box. Inline content and `display: contents` cannot. */
function canShell(el: Element): boolean {
  if (el instanceof SVGElement) return el instanceof SVGSVGElement && !el.querySelector('[id]');
  if (BLOCK_TAGS.has(el.tagName)) {
    const display = (el as HTMLElement).style?.display;
    return display !== 'inline' && display !== 'contents';
  }
  const display = getComputedStyle(el).display;
  return display !== 'inline' && display !== 'contents';
}

function isFullyOutside(box: DOMRect): boolean {
  return (
    box.width > 0 &&
    box.height > 0 &&
    (box.bottom <= 0 || box.top > window.innerHeight || box.left > window.innerWidth)
  );
}

/** A short wrapper is opened. A long off-screen list is not, unless it marks fixed or sticky inline. */
function shouldFollow(el: Element): boolean {
  if (!el.childElementCount) return false;
  if (el.childElementCount <= FOLLOW_CHILD_LIMIT) return true;
  return Boolean(el.querySelector('[style*="fixed"], [style*="sticky"]'));
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
 * Returns the elements it tagged, and the off-screen ancestors the filter must
 * keep so a fixed or sticky element is still reached.
 */
function tagPlacedElements(): { placed: Element[]; kept: Element[] } {
  const placed: Element[] = [];
  const sticky: Array<{ el: HTMLElement; box: DOMRect }> = [];
  const note = (el: HTMLElement, box: DOMRect) => {
    if (!box.width || !box.height || box.bottom < 0 || box.top > window.innerHeight) return;
    const position = getComputedStyle(el).position;
    if (position !== 'sticky' && position !== 'fixed') return;
    if (position === 'fixed') {
      el.setAttribute(
        PLACE_ATTR,
        `fixed:${Math.round(box.top + window.scrollY)}:${Math.round(box.left + window.scrollX)}`,
      );
      placed.push(el);
    } else {
      sticky.push({ el, box });
    }
  };
  /* A block fully above or below is not opened when it is a long list. A short
     wrapper still is, so a fixed dialog nested inside an off-screen container
     is found. */
  const walk = (parent: Element) => {
    for (const child of parent.children) {
      if (!(child instanceof Element) || child.closest('[data-pln-bridge]')) continue;
      const box = child.getBoundingClientRect();
      if (child instanceof HTMLElement) note(child, box);
      if (isFullyOutside(box) && canShell(child)) {
        if (shouldFollow(child)) walk(child);
      } else {
        walk(child);
      }
    }
  };
  if (document.body) walk(document.body);

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
      placed.push(el);
    });
  }
  const kept: Element[] = [];
  const seen = new Set<Element>();
  for (const el of placed) {
    for (let node = el.parentElement; node && node !== document.documentElement; node = node.parentElement) {
      if (seen.has(node)) break;
      seen.add(node);
      const box = node.getBoundingClientRect();
      if (
        !(
          box.width > 0 &&
          box.height > 0 &&
          (box.bottom <= 0 || box.top > window.innerHeight || box.left > window.innerWidth)
        )
      )
        continue;
      kept.push(node);
    }
  }
  return { placed, kept };
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

/** Pin a shelled box so flex and grid do not shrink it once its children are gone. */
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

type ParkedMedia = { node: Element; parent: Node; next: Node | null };

/**
 * `createContext` waits for every img and video in the document, up to the
 * timeout. An image fully outside the viewport is not in the picture, so it
 * must not hold the capture. It is detached for the wait and put back after.
 */
function parkUnloadedOffscreenMedia(): ParkedMedia[] {
  const parked: ParkedMedia[] = [];
  const width = window.innerWidth;
  const height = window.innerHeight;
  document.querySelectorAll('img, video').forEach((node) => {
    if (!(node instanceof HTMLElement) || !node.parentNode) return;
    const waiting =
      (node instanceof HTMLImageElement && !node.complete) ||
      (node instanceof HTMLVideoElement && node.readyState < 2);
    if (!waiting) return;
    const box = node.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0)) return;
    const outside = box.bottom <= 0 || box.top >= height || box.right <= 0 || box.left >= width;
    if (!outside) return;
    parked.push({ node, parent: node.parentNode, next: node.nextSibling });
    node.remove();
  });
  return parked;
}

function restoreParked(parked: ParkedMedia[]) {
  for (const { node, parent, next } of parked) {
    if (node.isConnected) continue;
    parent.insertBefore(node, next);
  }
}

/** Runs on each cloned node, synchronously: masking, and the same tidy-up the feedback kit applies. */
function prepareCloneNode(node: Node) {
  maskTypedValue(node);
  if (!(node instanceof HTMLElement)) return;
  for (const prop of ['overflow', 'overflow-x', 'overflow-y']) {
    const value = node.style.getPropertyValue(prop);
    if (value === 'auto' || value === 'scroll' || value === 'overlay') node.style.setProperty(prop, 'hidden');
  }
  /* Rows left after the ones below the fold are dropped must not stretch to the old table height. */
  if (['TABLE', 'TBODY', 'THEAD', 'TFOOT', 'TR'].includes(node.tagName)) {
    node.style.removeProperty('height');
    node.style.removeProperty('block-size');
  }
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
    includeStyleProperties: paintedStyleProperties(),
    filter: notBridge,
    onCloneEachNode: maskTypedValue,
    onCloneNode: maskFinishedClone,
  });
};

/**
 * The viewport, as the member sees it. `restoreScrollPosition` applies the
 * page's scroll (and inner scroll containers'); adding a scroll transform as
 * well would shift the picture twice. JPEG keeps a full viewport far under the
 * size cap. The long edge stays within MAX_EDGE, the same cap as a pin crop,
 * so a retina viewport is not painted at 2×.
 *
 * The filter drops a node that sits fully below or to the right of the viewport,
 * so that subtree is never styled. A block fully above stays as an empty box of
 * the same size, so what is on screen does not jump up; its children are not
 * styled. An image outside the viewport is dropped. The clone is not paused
 * between nodes. Scrollbar pseudos stay off. Only painted standard properties
 * are copied per node (`style-properties.ts`). Embedding still gives up with
 * CAPTURE_TOO_SLOW past the budget.
 *
 * `onEmbedNode` runs before the redraw count is read (modern-screenshot 4.7.0).
 */
async function captureViewport(): Promise<CaptureResult> {
  const startedAt = performance.now();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const { placed, kept } = tagPlacedElements();
  const keep = new Set<Node>([...placed, ...kept]);
  const shells: Element[] = [];
  const checkBudget = () => {
    if (performance.now() - startedAt > CAPTURE_BUDGET_MS) throw new Error(CAPTURE_TOO_SLOW);
  };
  const shellParent = (node: Node): Element | null => {
    if (node.parentNode instanceof ShadowRoot) return node.parentNode.host;
    return node.parentElement;
  };
  const keepNode = (node: Node): boolean => {
    if (!notBridge(node)) return false;
    /* A placed element, or the off-screen ancestor that reaches it, stays whole. */
    if (keep.has(node)) return true;
    const parent = shellParent(node);
    if (parent instanceof Element && parent.hasAttribute(SHELL_ATTR)) return false;
    if (!(node instanceof Element)) return true;
    const root = node.getRootNode();
    if (root instanceof ShadowRoot && !keepNode(root.host)) return false;
    const box = node.getBoundingClientRect();
    if (node.tagName === 'IMG') {
      return !(box.bottom < 0 || box.top > height || box.right < 0 || box.left > width);
    }
    if (box.width === 0 && box.height === 0) return true;
    /* An <svg> of ids can be off screen and still paint an icon via url(#…). */
    if (node instanceof SVGSVGElement && node.querySelector('[id]')) return true;
    if (box.bottom <= 0 && box.width > 0 && box.height > 0 && canShell(node)) {
      node.setAttribute(SHELL_ATTR, '');
      shells.push(node);
      return true;
    }
    return !(box.top > height || box.left > width);
  };
  let context: Context<HTMLElement> | undefined;
  const parked = parkUnloadedOffscreenMedia();
  const fontCss = await ensureFontCache();
  try {
    context = await createContext(document.documentElement, {
      type: 'image/jpeg',
      width,
      height,
      scale: Math.min(window.devicePixelRatio || 1, 2, MAX_EDGE / Math.max(width, height, 1)),
      quality: 0.85,
      backgroundColor: backgroundBehind(document.body),
      timeout: 8000,
      ...(fontCss ? { font: { cssText: fontCss } } : {}),
      includeStyleProperties: paintedStyleProperties(),
      features: { restoreScrollPosition: true, copyScrollbar: false },
      filter: keepNode,
      onCloneEachNode: prepareCloneNode,
      onCloneNode: (root) => {
        pinShells(root);
        placeTagged(root);
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
    restoreParked(parked);
    if (context) destroyContext(context);
    placed.forEach((el) => el.removeAttribute(PLACE_ATTR));
    shells.forEach((el) => el.removeAttribute(SHELL_ATTR));
  }
}

/* A capture already under way answers a second request too: one render, not two.
   A finished picture is reused while the viewport is the same one it was drawn from. */
let running: Promise<CaptureResult> | null = null;

(window as BridgeRenderWindow).__plnBridgeCapture = () => {
  running ??= withViewportShot(captureViewport).finally(() => {
    running = null;
  });
  return running;
};
