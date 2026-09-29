import { describeElement, rectOf } from './describe';
import {
  BRIDGE_VERSION,
  LIMITS,
  envelope,
  isEnvelope,
  type AppMessage,
  type BridgeCapability,
  type BridgeRect,
} from './protocol';

/**
 * The in-app half of the LabOS bridge. It runs inside an embedded AI App and
 * answers a FIXED set of commands from exactly one parent origin.
 *
 * Security posture (see the spike doc):
 * - Obeys only messages whose origin is `parentOrigin` AND whose source is
 *   `window.parent`; replies go to that origin, never `'*'`.
 * - Inert when not framed.
 * - No eval, no caller-supplied selectors, no storage/cookie reads. The only
 *   DOM it reports on is an element the member clicked while in pick mode.
 */

export const MARKER_ATTR = 'data-pln-bridge';
const CAPABILITIES: BridgeCapability[] = ['pick', 'describe', 'crop'];
const CROP_LOAD_TIMEOUT_MS = 10_000;
const ACCENT = '#1b4dff';
const RECT_FALLBACK_MS = 100;

type CropFn = (el: Element) => Promise<string>;
type BridgeWindow = Window & { __plnBridge?: { version: number; destroy: () => void }; __plnBridgeCrop?: CropFn };

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
  const lastSent = new Map<string, string>();
  let pinCounter = 0;
  let picking = false;
  let hovered: Element | null = null;
  let frame = 0;
  let frameFallback = 0;
  let cropLoader: Promise<CropFn> | null = null;
  const session = Math.random().toString(36).slice(2, 12);
  const announce = () => send({ type: 'ready', payload: { capabilities: CAPABILITIES, session } });

  const send = (message: AppMessage) => win.parent.postMessage(envelope(message), parentOrigin);

  /* ---------- pick mode ---------- */

  const outline = doc.createElement('div');
  outline.setAttribute(MARKER_ATTR, 'outline');
  Object.assign(outline.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483647',
    border: `2px solid ${ACCENT}`,
    background: 'rgba(27, 77, 255, 0.08)',
    borderRadius: '3px',
    boxSizing: 'border-box',
    display: 'none',
  } satisfies Partial<CSSStyleDeclaration>);
  const label = doc.createElement('div');
  label.setAttribute(MARKER_ATTR, 'label');
  Object.assign(label.style, {
    position: 'absolute',
    left: '-2px',
    bottom: '100%',
    marginBottom: '4px',
    padding: '2px 6px',
    font: '600 11px/16px system-ui, sans-serif',
    color: '#fff',
    background: ACCENT,
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  } satisfies Partial<CSSStyleDeclaration>);
  outline.appendChild(label);

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
    Object.assign(outline.style, {
      display: 'block',
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.w}px`,
      height: `${rect.h}px`,
    });
    label.textContent = hovered.tagName.toLowerCase() + (hovered.id ? `#${hovered.id}` : '');
    /* Flip the tag inside the box when there is no room above it. */
    label.style.bottom = rect.y < 24 ? 'auto' : '100%';
    label.style.top = rect.y < 24 ? '2px' : 'auto';
  };

  const onPointerMove = (event: PointerEvent) => {
    const target = doc.elementFromPoint(event.clientX, event.clientY);
    if (!target || isOwn(target) || target === hovered) return;
    hovered = target;
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
    const target = hovered ?? doc.elementFromPoint(event.clientX, event.clientY);
    if (!target || isOwn(target)) return;
    if (pins.size >= LIMITS.pins) return;
    pinCounter += 1;
    const pinId = `pin-${pinCounter}`;
    pins.set(pinId, target);
    watch(target);
    stopPicking();
    send({ type: 'pick:selected', payload: { pinId, element: describeElement(target, win) } });
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
    /* Alt/⌥ walks the highlight up one ancestor per press — the innermost
       element under the pointer is often a <span> inside the thing meant. */
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
      lastSent.delete(id);
    }
    unwatchAllIfIdle();
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
      default:
        /* Unknown commands are ignored: a newer LabOS may speak to an older bridge. */
        return;
    }
  };

  win.addEventListener('message', onMessage);
  announce();

  const destroy = () => {
    stopPicking();
    forget([...pins.keys()]);
    if (frame) win.cancelAnimationFrame(frame);
    if (frameFallback) win.clearTimeout(frameFallback);
    win.removeEventListener('message', onMessage);
    delete w.__plnBridge;
  };
  w.__plnBridge = { version: BRIDGE_VERSION, destroy };
  return destroy;
}
