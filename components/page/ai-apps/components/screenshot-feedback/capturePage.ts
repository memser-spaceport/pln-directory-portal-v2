import { createContext, destroyContext, domToJpeg, type Context } from 'modern-screenshot';

import { ensureFontCache } from '@/ai-apps-bridge/font-cache';
import { paintedStyleProperties } from '@/ai-apps-bridge/style-properties';
import { withViewportShot } from '@/ai-apps-bridge/viewport-shot-cache';
import { CAPTURE_TOO_SLOW } from '@/ai-apps-bridge/protocol';

/**
 * A picture of the LabOS page on screen, for feedback on the AI Apps list.
 * The app page does not use this: its picture comes from the app's bridge,
 * because that frame is cross-origin and a host redraw cannot see inside it.
 *
 * Same redraw rules as the bridge viewport capture (`ai-apps-bridge/crop-entry.ts`):
 * JPEG, long edge capped, the page's scroll restored, fixed and sticky bars put
 * back where they sit, and a give-up when the page is too heavy to draw.
 * A block fully above stays as an empty box. An unloaded image fully outside
 * the viewport does not hold the wait. A long block fully off screen is not
 * measured while sticky and fixed elements are found. Font files prepared
 * while the page is idle are reused, so the capture does not fetch them again.
 * Only painted standard properties are copied per node (`style-properties.ts`).
 */

export type PageCapture = { dataUrl: string; width: number; height: number };

/** The feedback drawer and the floating button carry this, so they stay out of the picture. */
export const FEEDBACK_CAPTURE_IGNORE_ATTR = 'data-feedback-capture-ignore';

const MAX_EDGE = 1600;
/** Set on the live page for one capture only, to find sticky/fixed elements again in the clone. */
const PLACE_ATTR = 'data-feedback-capture-place';
/** Set on a block fully above the viewport: the box stays, its contents are not drawn. */
const SHELL_ATTR = 'data-feedback-capture-shell';
/**
 * A fully off-screen block with at most this many element children is still opened,
 * so a fixed or sticky element nested a few wrappers deep is still found.
 * A long list below the fold is not.
 */
const FOLLOW_CHILD_LIMIT = 32;
const CAPTURE_BUDGET_MS = 5000;
const FETCH_TIMEOUT_MS = 8000;
const DRAW_RETRY_CAP = 3;
/** Set for one capture on the element a video's still goes in front of, in the clone. */
const STILL_BEFORE_ATTR = 'data-feedback-capture-still-before';
/** …or on the video's parent, when nothing follows the video there. */
const STILL_END_ATTR = 'data-feedback-capture-still-end';
const STILL_STYLE_PROPERTIES = [
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
  'width',
  'height',
  'margin',
  'border-radius',
  'object-fit',
  'object-position',
  'transform',
];

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

function ignored(node: Node): boolean {
  return node instanceof Element && Boolean(node.closest(`[${FEEDBACK_CAPTURE_IGNORE_ATTR}]`));
}

function backgroundBehind(el: Element): string {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor;
    if (color && color !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(color)) return color;
  }
  return '#ffffff';
}

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
    box.width > 0 && box.height > 0 && (box.bottom <= 0 || box.top > window.innerHeight || box.left > window.innerWidth)
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
 * lands at the top of the page. Record where each visible one is on screen;
 * in the clone, put it back there. Sticky offsets are measured by switching
 * one nesting level to `static` together, so a sticky inside a sticky is
 * measured after its ancestor is back.
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
      if (!(child instanceof Element) || ignored(child)) continue;
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
 * must not hold the capture. Nor does one that is not rendered: a lazy image
 * inside `display: none` never loads, so it held every capture for the full
 * timeout. It is detached for the wait and put back after. Videos are handled
 * by `standInForVideos`.
 */
function parkUnloadedOffscreenImages(): ParkedMedia[] {
  const parked: ParkedMedia[] = [];
  const width = window.innerWidth;
  const height = window.innerHeight;
  document.querySelectorAll('img').forEach((node) => {
    if (!node.parentNode || node.complete) return;
    const rendered = node.getClientRects().length > 0;
    const box = node.getBoundingClientRect();
    const outside =
      box.width > 0 && box.height > 0 && (box.bottom <= 0 || box.top >= height || box.right <= 0 || box.left >= width);
    if (rendered && !outside) return;
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

function hasCurrentFrame(video: HTMLVideoElement): boolean {
  return video.readyState >= 2 && video.videoWidth > 0;
}

/** The frame on screen, or null when the browser will not hand it over (a cross-origin source it treats as tainted). */
function currentFrame(video: HTMLVideoElement): string | null {
  const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  try {
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}

/** The video as a box of the same size and place: its frame when there is one, empty otherwise. */
function stillOf(video: HTMLVideoElement, frame: string | null): HTMLElement {
  const still = frame ? Object.assign(document.createElement('img'), { src: frame }) : document.createElement('div');
  const computed = getComputedStyle(video);
  STILL_STYLE_PROPERTIES.forEach((prop) => still.style.setProperty(prop, computed.getPropertyValue(prop)));
  still.style.setProperty('display', computed.display === 'inline' ? 'inline-block' : computed.display);
  return still;
}

/**
 * The library re-downloads a video into a fresh element and seeks it, with no
 * timeout, before drawing it: seconds for a playing pitch video, the whole
 * capture lost for one still loading. No video reaches it; a still stands in.
 * A video with a frame stays on the page untouched, so playback goes on, and
 * its still is put in the clone where it was. One still loading has no frame
 * to lose: its empty still takes its place on the page for the capture, which
 * keeps it out of the library's media wait without moving the layout.
 */
function standInForVideos(): { stills: HTMLElement[]; restore: () => void } {
  const stills: HTMLElement[] = [];
  const marked: Element[] = [];
  const swapped: Array<[HTMLVideoElement, HTMLElement]> = [];
  const parked: ParkedMedia[] = [];
  const mark = (el: Element, attr: string, index: number) => {
    el.setAttribute(attr, `${el.getAttribute(attr) ?? ''} ${index}`.trim());
    marked.push(el);
  };
  document.querySelectorAll('video').forEach((video) => {
    if (ignored(video) || !video.parentNode) {
      return;
    }
    const rendered = video.getClientRects().length > 0;
    if (!hasCurrentFrame(video)) {
      if (rendered) {
        const still = stillOf(video, null);
        video.replaceWith(still);
        swapped.push([video, still]);
      } else {
        parked.push({ node: video, parent: video.parentNode, next: video.nextSibling });
        video.remove();
      }
      return;
    }
    if (!rendered) {
      return;
    }
    const box = video.getBoundingClientRect();
    const onScreen = box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth;
    const index = stills.push(stillOf(video, onScreen ? currentFrame(video) : null)) - 1;
    let next = video.nextElementSibling;
    while (next instanceof HTMLVideoElement) {
      next = next.nextElementSibling;
    }
    if (next) {
      mark(next, STILL_BEFORE_ATTR, index);
    } else if (video.parentElement) {
      mark(video.parentElement, STILL_END_ATTR, index);
    }
  });
  return {
    stills,
    restore: () => {
      swapped.forEach(([video, still]) => still.replaceWith(video));
      restoreParked(parked);
      marked.forEach((el) => {
        el.removeAttribute(STILL_BEFORE_ATTR);
        el.removeAttribute(STILL_END_ATTR);
      });
    },
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * An image the page loaded without CORS is cached without its CORS headers, and
 * the library's `force-cache` fetch fails on that copy. Only then is it fetched
 * again past the cache: revalidating every image costs a round trip each, which
 * a slow connection can't afford inside the capture budget. False hands the
 * image back to the library, which draws its placeholder.
 */
async function fetchImage(url: string): Promise<string | false> {
  for (const cache of ['force-cache', 'no-cache'] as const) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, { cache, signal: controller.signal });
      if (response.ok) {
        return await blobToDataUrl(await response.blob());
      }
    } catch {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return false;
}

function placeStills(root: Node, stills: HTMLElement[]) {
  if (!(root instanceof Element)) {
    return;
  }
  const take = (el: Element, attr: string) => {
    const indices = (el.getAttribute(attr) ?? '').split(' ').map(Number);
    el.removeAttribute(attr);
    return indices.map((index) => stills[index]);
  };
  root.querySelectorAll(`[${STILL_BEFORE_ATTR}]`).forEach((el) => el.before(...take(el, STILL_BEFORE_ATTR)));
  root.querySelectorAll(`[${STILL_END_ATTR}]`).forEach((el) => el.append(...take(el, STILL_END_ATTR)));
}

async function renderViewport(): Promise<PageCapture> {
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
    if (ignored(node)) return false;
    /* A placed element, or the off-screen ancestor that reaches it, stays whole. */
    if (keep.has(node)) return true;
    const parent = shellParent(node);
    if (parent instanceof Element && parent.hasAttribute(SHELL_ATTR)) return false;
    if (!(node instanceof Element)) return true;
    if (node instanceof HTMLVideoElement) {
      return false;
    }
    const box = node.getBoundingClientRect();
    if (node.tagName === 'IMG') {
      return !(box.bottom < 0 || box.top > height || box.right < 0 || box.left > width);
    }
    if (box.width === 0 && box.height === 0) return true;
    if (node instanceof SVGSVGElement && node.querySelector('[id]')) return true;
    if (box.bottom <= 0 && box.width > 0 && box.height > 0 && canShell(node)) {
      node.setAttribute(SHELL_ATTR, '');
      shells.push(node);
      return true;
    }
    return !(box.top > height || box.left > width);
  };
  let context: Context<HTMLElement> | undefined;
  const fontCss = await ensureFontCache();
  const parked = parkUnloadedOffscreenImages();
  const videos = standInForVideos();
  try {
    context = await createContext(document.documentElement, {
      type: 'image/jpeg',
      width,
      height,
      scale: Math.min(window.devicePixelRatio || 1, 2, MAX_EDGE / Math.max(width, height, 1)),
      quality: 0.85,
      backgroundColor: backgroundBehind(document.body),
      timeout: FETCH_TIMEOUT_MS,
      ...(fontCss ? { font: { cssText: fontCss } } : {}),
      includeStyleProperties: paintedStyleProperties(),
      features: { restoreScrollPosition: true, copyScrollbar: false },
      fetchFn: fetchImage,
      filter: keepNode,
      onCloneNode: (root) => {
        pinShells(root);
        placeTagged(root);
        placeStills(root, videos.stills);
      },
      onEmbedNode: () => {
        checkBudget();
        if (context) context.drawImageCount = Math.min(context.drawImageCount, DRAW_RETRY_CAP);
      },
    });
    const dataUrl = await domToJpeg(context);
    return { dataUrl, width, height };
  } finally {
    restoreParked(parked);
    videos.restore();
    if (context) destroyContext(context);
    placed.forEach((el) => el.removeAttribute(PLACE_ATTR));
    shells.forEach((el) => el.removeAttribute(SHELL_ATTR));
  }
}

let running: Promise<PageCapture> | null = null;

/** The visible window, as a JPEG. A capture already under way answers a second request too.
 *  A finished picture is reused while the viewport is the same one it was drawn from. */
export function capturePageViewport(): Promise<PageCapture> {
  running ??= withViewportShot(renderViewport).finally(() => {
    running = null;
  });
  return running;
}

/** A wheel over Pick a part on the list: the overlay covers the page, so the page scrolls from here. */
export function scrollPage(_x: number, _y: number, dx: number, dy: number) {
  window.scrollBy({ left: dx, top: dy, behavior: 'instant' });
}
