import { describeElement, rectOf, visibleText } from './describe';
import { pickTarget, pointWithin } from './target';
import {
  BRIDGE_VERSION,
  LIMITS,
  envelope,
  isEnvelope,
  type AppMessage,
  type BridgeCapability,
  type BridgeRect,
  type LocateRequest,
  type LocateResult,
} from './protocol';

/**
 * The in-app half of the LabOS bridge. It runs inside an embedded AI App and
 * answers a FIXED set of commands from exactly one parent origin.
 *
 * Security posture (see the spike doc):
 * - Obeys only messages whose origin is `parentOrigin` AND whose source is
 *   `window.parent`; replies go to that origin, never `'*'`.
 * - Inert when not framed.
 * - No eval, no storage/cookie reads. It describes only an element the member
 *   clicked while in pick mode.
 * - The one caller-supplied input is a stored pin's selector, tag and text
 *   (`locate`, for the feedback overlay). It is only ever used to find
 *   elements, and the answer is a position: never text, markup or attributes.
 *   Matching on a selector reveals at most whether such an element exists on
 *   the page the viewer is already looking at.
 * - `capture` returns a picture of what the viewer already sees in the frame
 *   (its viewport), with typed values, select choices, editable text and
 *   anything the app marks `data-labos-mask` masked, and nothing of the
 *   bridge's own UI. It is taken only when LabOS asks, for the feedback form.
 */

export const MARKER_ATTR = 'data-pln-bridge';
const CAPABILITIES: BridgeCapability[] = ['pick', 'describe', 'crop', 'locate', 'capture'];
const CROP_LOAD_TIMEOUT_MS = 10_000;
const ACCENT = '#1b4dff';
const RECT_FALLBACK_MS = 100;

type CropFn = (el: Element) => Promise<string>;
type CaptureFn = () => Promise<{ dataUrl: string; width: number; height: number }>;
type BridgeWindow = Window & {
  __plnBridge?: { version: number; destroy: () => void };
  __plnBridgeCrop?: CropFn;
  /** Set by the same lazily loaded chunk as the crop; absent from a chunk older than `capture`. */
  __plnBridgeCapture?: CaptureFn;
};

export type BridgeOptions = {
  /** The only origin the bridge will talk to: the LabOS deployment that served the script. */
  parentOrigin: string;
  /** Where the lazily loaded crop chunk lives (same folder as the script). */
  cropScriptUrl: string;
};

export function createBridge(win: Window, { parentOrigin, cropScriptUrl }: BridgeOptions): () => void {
  const w = win as BridgeWindow;
  const doc = win.document;
  if (win.parent === win || w.__plnBridge) return () => undefined;

  const pins = new Map<string, Element>();
  /** The subset of `pins` the member picked. Only these count against the pick limit; located ones never do. */
  const picked = new Set<string>();
  const lastSent = new Map<string, string>();
  let pinCounter = 0;
  let locateCounter = 0;
  let picking = false;
  let hovered: Element | null = null;
  /** The raw element under the pointer, so ⌥'s walk up survives small moves over the same element. */
  let lastHit: Element | null = null;
  let frame = 0;
  let frameFallback = 0;
  let cropLoader: Promise<CropFn> | null = null;
  const session = Math.random().toString(36).slice(2, 12);
  const announce = () => send({ type: 'ready', payload: { capabilities: CAPABILITIES, session } });

  const send = (message: AppMessage) => win.parent.postMessage(envelope(message), parentOrigin);

  /* ---------- pick mode ---------- */

  /* The element under the pointer, as LabOS outlines a pin's element (and the
     prototype's comment layer does): a brand ring just outside it with a soft
     halo, gliding between elements. No tag label — members point at things,
     they don't read markup. */
  const outline = doc.createElement('div');
  outline.setAttribute(MARKER_ATTR, 'outline');
  Object.assign(outline.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483647',
    outline: `2px solid ${ACCENT}`,
    outlineOffset: '1px',
    boxShadow: '0 0 0 4px rgba(27, 77, 255, 0.12)',
    borderRadius: '4px',
    boxSizing: 'border-box',
    transition: 'left 60ms linear, top 60ms linear, width 60ms linear, height 60ms linear',
    display: 'none',
  } satisfies Partial<CSSStyleDeclaration>);

  const cursorStyle = doc.createElement('style');
  cursorStyle.setAttribute(MARKER_ATTR, 'cursor');
  cursorStyle.textContent = '*{cursor:crosshair!important}';

  const isOwn = (node: EventTarget | null) => node instanceof Element && node.closest(`[${MARKER_ATTR}]`) !== null;

  const paintHover = () => {
    const rect = hovered ? rectOf(hovered) : null;
    if (!hovered || !rect) {
      outline.style.display = 'none';
      return;
    }
    /* The ring follows the element's own corners (a 12px card gets a 12px
       ring); square elements keep a soft 4px. */
    const radius = win.getComputedStyle(hovered).borderRadius;
    Object.assign(outline.style, {
      display: 'block',
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.w}px`,
      height: `${rect.h}px`,
      borderRadius: radius && !/^0(px)?$/.test(radius) ? radius : '4px',
    });
  };

  const onPointerMove = (event: PointerEvent) => {
    const hit = doc.elementFromPoint(event.clientX, event.clientY);
    if (!hit || isOwn(hit) || hit === lastHit) return;
    lastHit = hit;
    hovered = pickTarget(hit, win);
    paintHover();
  };

  /* Pointer presses never reach the app in pick mode: the click IS the pick. */
  const swallow = (event: Event) => {
    if (!picking) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const onClick = (event: MouseEvent) => {
    swallow(event);
    /* A tap has no hover before it: pick from the point, by the same rule. */
    const hit = hovered ? null : doc.elementFromPoint(event.clientX, event.clientY);
    const target = hovered ?? (hit && !isOwn(hit) ? pickTarget(hit, win) : null);
    if (!target || isOwn(target)) return;
    if (picked.size >= LIMITS.pins) return;
    pinCounter += 1;
    const pinId = `pin-${pinCounter}`;
    pins.set(pinId, target);
    picked.add(pinId);
    watch(target);
    stopPicking();
    send({
      type: 'pick:selected',
      payload: {
        pinId,
        element: describeElement(target, win),
        point: pointWithin(target, event.clientX, event.clientY),
      },
    });
    scheduleRects();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!picking) return;
    if (event.key === 'Escape') {
      swallow(event);
      stopPicking();
      send({ type: 'pick:cancelled' });
      return;
    }
    /* Alt/⌥ walks the highlight up one ancestor per press, from the target the
       pick rule chose — for when the thing meant is bigger than the nearest
       control or card. */
    if (event.key === 'Alt' && hovered?.parentElement && hovered.parentElement !== doc.documentElement) {
      swallow(event);
      hovered = hovered.parentElement;
      paintHover();
    }
  };

  const PRESS_EVENTS = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'dblclick', 'auxclick', 'contextmenu'];

  function startPicking() {
    if (picking) return;
    picking = true;
    doc.documentElement.appendChild(outline);
    doc.head.appendChild(cursorStyle);
    win.addEventListener('pointermove', onPointerMove, true);
    win.addEventListener('click', onClick, true);
    win.addEventListener('keydown', onKeyDown, true);
    for (const type of PRESS_EVENTS) win.addEventListener(type, swallow, true);
  }

  function stopPicking() {
    if (!picking) return;
    picking = false;
    hovered = null;
    lastHit = null;
    outline.remove();
    cursorStyle.remove();
    win.removeEventListener('pointermove', onPointerMove, true);
    win.removeEventListener('click', onClick, true);
    win.removeEventListener('keydown', onKeyDown, true);
    for (const type of PRESS_EVENTS) win.removeEventListener(type, swallow, true);
  }

  /* ---------- keeping pins in place ---------- */

  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => scheduleRects()) : null;
  const mutationObserver = typeof MutationObserver !== 'undefined' ? new MutationObserver(() => scheduleRects()) : null;
  let observing = false;

  function watch(el: Element) {
    resizeObserver?.observe(el);
    if (!observing) {
      observing = true;
      mutationObserver?.observe(doc.documentElement, { childList: true, subtree: true, attributes: true });
      win.addEventListener('scroll', scheduleRects, { capture: true, passive: true });
      win.addEventListener('resize', scheduleRects);
    }
  }

  function unwatchAllIfIdle() {
    if (pins.size > 0 || !observing) return;
    observing = false;
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    win.removeEventListener('scroll', scheduleRects, true);
    win.removeEventListener('resize', scheduleRects);
  }

  function scheduleRects() {
    if (frame || frameFallback || pins.size === 0) return;
    frame = win.requestAnimationFrame(flushRects);
    /* rAF never fires in a hidden tab, and Chrome throttles it in cross-origin
       frames it thinks are offscreen. Whichever comes first wins. */
    frameFallback = win.setTimeout(flushRects, RECT_FALLBACK_MS);
  }

  /** Sends only what moved. `null` = the element left the page or collapsed to nothing: the pin is detached. */
  function flushRects() {
    if (frame) win.cancelAnimationFrame(frame);
    if (frameFallback) win.clearTimeout(frameFallback);
    frame = 0;
    frameFallback = 0;
    const changed: Record<string, BridgeRect | null> = {};
    let any = false;
    pins.forEach((el, pinId) => {
      const rect = rectOf(el);
      const key = JSON.stringify(rect);
      if (lastSent.get(pinId) === key) return;
      lastSent.set(pinId, key);
      changed[pinId] = rect;
      any = true;
    });
    if (any) send({ type: 'pins:rects', payload: { rects: changed } });
  }

  function forget(pinIds: string[]) {
    for (const id of pinIds) {
      const el = pins.get(id);
      if (el) resizeObserver?.unobserve(el);
      pins.delete(id);
      picked.delete(id);
      lastSent.delete(id);
    }
    unwatchAllIfIdle();
  }

  /* ---------- locate (the feedback overlay) ---------- */

  const sameTag = (el: Element, tag: string) => el.tagName.toLowerCase() === tag.toLowerCase();

  /**
   * One element for a stored pin, or none. The selector first; when it no
   * longer matches exactly one element of the right tag (a redeploy shifted an
   * nth-of-type, an id changed), the same tag with the same visible text. Both
   * must match exactly one element: pointing at the wrong thing is worse than
   * admitting the pin is lost.
   */
  function findElement({ selector, tag, text }: LocateRequest): Element | null {
    let bySelector: Element[] = [];
    try {
      bySelector = Array.from(doc.querySelectorAll(selector)).filter((el) => !isOwn(el));
    } catch {
      /* A stored selector this browser cannot parse: fall through to the text match. */
    }
    if (bySelector.length === 1 && sameTag(bySelector[0], tag)) return bySelector[0];
    if (!text) return null;

    /* visibleText clips with an ellipsis, so compare clipped to clipped; the
       cheap textContent check only narrows before innerText forces layout. */
    const needle = text.endsWith('…') ? text.slice(0, -1) : text;
    const matches: Element[] = [];
    for (const el of Array.from(doc.getElementsByTagName(tag))) {
      if (isOwn(el) || !(el.textContent ?? '').replace(/\s+/g, ' ').includes(needle)) continue;
      if (visibleText(el) !== text) continue;
      matches.push(el);
      if (matches.length > 1) return null;
    }
    return matches[0] ?? null;
  }

  function locate(requests: LocateRequest[]) {
    const results: Record<string, LocateResult | null> = {};
    for (const request of requests) {
      const el = findElement(request);
      if (!el) {
        results[request.key] = null;
        continue;
      }
      locateCounter += 1;
      const pinId = `loc-${locateCounter}`;
      const rect = rectOf(el);
      pins.set(pinId, el);
      lastSent.set(pinId, JSON.stringify(rect));
      watch(el);
      results[request.key] = { pinId, rect };
    }
    send({ type: 'locate:result', payload: { results } });
  }

  /** Every field typed and capped; one bad request is dropped, not the batch. */
  function readLocateRequests(value: unknown): LocateRequest[] {
    if (!Array.isArray(value)) return [];
    const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
    return value
      .slice(0, LIMITS.locate)
      .filter(
        (r): r is LocateRequest =>
          !!r &&
          typeof r === 'object' &&
          isText(r.key, LIMITS.locateKey) &&
          isText(r.selector, LIMITS.locateSelector) &&
          isText(r.tag, 64) &&
          /^[a-z][a-z0-9-]*$/i.test(r.tag) &&
          isText(r.text, LIMITS.text),
      );
  }

  /* ---------- crop ---------- */

  function loadCrop(): Promise<CropFn> {
    if (w.__plnBridgeCrop) return Promise.resolve(w.__plnBridgeCrop);
    cropLoader ??= new Promise<CropFn>((resolve, reject) => {
      const script = doc.createElement('script');
      script.src = cropScriptUrl;
      script.async = true;
      script.setAttribute(MARKER_ATTR, 'crop');
      const timer = win.setTimeout(() => reject(new Error('crop-load-timeout')), CROP_LOAD_TIMEOUT_MS);
      script.onload = () => {
        win.clearTimeout(timer);
        if (w.__plnBridgeCrop) resolve(w.__plnBridgeCrop);
        else reject(new Error('crop-missing'));
      };
      script.onerror = () => {
        win.clearTimeout(timer);
        reject(new Error('crop-load-failed'));
      };
      doc.head.appendChild(script);
    }).catch((error) => {
      cropLoader = null;
      throw error;
    });
    return cropLoader;
  }

  async function crop(pinId: string) {
    const el = pins.get(pinId);
    if (!el || !rectOf(el)) {
      send({ type: 'crop:result', payload: { pinId, error: 'detached' } });
      return;
    }
    try {
      const dataUrl = await (await loadCrop())(el);
      if (dataUrl.length > LIMITS.cropDataUrl) {
        send({ type: 'crop:result', payload: { pinId, error: 'too-large' } });
        return;
      }
      send({ type: 'crop:result', payload: { pinId, dataUrl } });
    } catch (error) {
      send({ type: 'crop:result', payload: { pinId, error: error instanceof Error ? error.message : 'crop-failed' } });
    }
  }

  /* ---------- capture: the app as it is on screen ---------- */

  async function capture(key: string) {
    try {
      await loadCrop();
      /* A browser can hold a renderer cached from before `capture` existed. */
      const render = w.__plnBridgeCapture;
      if (!render) throw new Error('capture-missing');
      const { dataUrl, width, height } = await render();
      if (dataUrl.length > LIMITS.cropDataUrl) {
        send({ type: 'capture:result', payload: { key, error: 'too-large' } });
        return;
      }
      send({ type: 'capture:result', payload: { key, dataUrl, width, height } });
    } catch (error) {
      send({
        type: 'capture:result',
        payload: { key, error: error instanceof Error ? error.message : 'capture-failed' },
      });
    }
  }

  /* ---------- the feedback shortcut ---------- */

  /* Same rules as LabOS's own Alt+F: the physical key (Option+F types "ƒ" on a
     Mac), and never while typing in one of the app's fields. */
  const onShortcutKey = (event: KeyboardEvent) => {
    if (event.code !== 'KeyF' || !event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (event.isComposing || event.repeat || event.defaultPrevented) return;
    const target = event.target as HTMLElement | null;
    if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) return;
    event.preventDefault();
    send({ type: 'shortcut:feedback' });
  };

  /* ---------- the channel ---------- */

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== parentOrigin || event.source !== win.parent || !isEnvelope(event.data)) return;
    const { type, payload } = event.data as { type: string; payload?: Record<string, unknown> };
    switch (type) {
      case 'hello':
        announce();
        return;
      case 'pick:start':
        startPicking();
        return;
      case 'pick:stop':
        stopPicking();
        return;
      case 'pins:unwatch':
        if (Array.isArray(payload?.pinIds)) forget(payload.pinIds.filter((id): id is string => typeof id === 'string'));
        return;
      case 'pins:clear':
        stopPicking();
        forget([...pins.keys()]);
        return;
      case 'crop':
        if (typeof payload?.pinId === 'string') void crop(payload.pinId);
        return;
      case 'locate':
        locate(readLocateRequests(payload?.requests));
        return;
      case 'capture':
        if (typeof payload?.key === 'string' && payload.key.length <= LIMITS.captureKey) void capture(payload.key);
        return;
      default:
        /* Unknown commands are ignored: a newer LabOS may speak to an older bridge. */
        return;
    }
  };

  win.addEventListener('message', onMessage);
  win.addEventListener('keydown', onShortcutKey);
  announce();

  const destroy = () => {
    stopPicking();
    forget([...pins.keys()]);
    if (frame) win.cancelAnimationFrame(frame);
    if (frameFallback) win.clearTimeout(frameFallback);
    win.removeEventListener('message', onMessage);
    win.removeEventListener('keydown', onShortcutKey);
    delete w.__plnBridge;
  };
  w.__plnBridge = { version: BRIDGE_VERSION, destroy };
  return destroy;
}
