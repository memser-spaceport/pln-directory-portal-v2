'use client';

import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

/** A rectangle in the viewport (CSS px). */
export type ClientRect = { x: number; y: number; width: number; height: number };

type Pt = { x: number; y: number };
export type Corner = 'nw' | 'ne' | 'sw' | 'se';
export const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se'];

/** `before` is the rectangle to put back if the browser takes the pointer away mid-drag. */
type Drag =
  | { kind: 'draw'; id: number; bounds: ClientRect; from: Pt; before: ClientRect | null }
  | { kind: 'corner'; id: number; bounds: ClientRect; fixed: Pt; grab: Pt; before: ClientRect }
  | { kind: 'move'; id: number; bounds: ClientRect; start: Pt; before: ClientRect };

/** Smaller than this on either side is a mis-tap, not a selection. */
const MIN_SIZE = 8;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clampTo = (p: Pt, b: ClientRect): Pt => ({
  x: clamp(p.x, b.x, b.x + b.width),
  y: clamp(p.y, b.y, b.y + b.height),
});
const span = (a: Pt, b: Pt): ClientRect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(b.x - a.x),
  height: Math.abs(b.y - a.y),
});
export const isTooSmall = (r: ClientRect | null) => !r || r.width < MIN_SIZE || r.height < MIN_SIZE;

/**
 * Dragging a rectangle to choose what to capture, shared by Pick a part and the
 * crop after Take screenshot (feedback kit, RegionPicker).
 *
 * With a mouse, letting go confirms. With a finger or a pen, letting go leaves
 * the rectangle up (`adjusting`): corners resize it, dragging inside moves it,
 * drawing outside starts again, and `confirm` or Enter takes it. The surface
 * claims every touch, so a drag never scrolls or zooms the page and the browser
 * rarely cancels the pointer half way.
 */
export function useRegionPicker({
  getBounds,
  onConfirm,
  onCancel,
}: {
  /** Where a rectangle may go, read when a drag starts. */
  getBounds: () => ClientRect | null;
  onConfirm: (rect: ClientRect) => void;
  onCancel: () => void;
}) {
  const [selection, setSelection] = useState<ClientRect | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const selectionRef = useRef<ClientRect | null>(null);
  const adjustingRef = useRef(false);
  const drag = useRef<Drag | null>(null);
  const done = useRef(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef(onConfirm);
  useEffect(() => {
    confirmRef.current = onConfirm;
  });

  const show = (r: ClientRect | null) => {
    selectionRef.current = r;
    setSelection(r);
  };
  const startAdjusting = () => {
    adjustingRef.current = true;
    setAdjusting(true);
  };
  const confirm = (r: ClientRect | null) => {
    if (done.current || !r || isTooSmall(r)) return;
    done.current = true;
    confirmRef.current(r);
  };

  /* Capture phase on document, so the key reaches this layer before the feedback dialog or the app frame. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCancel();
        return;
      }
      if (event.key === 'Enter' && adjustingRef.current && !isTooSmall(selectionRef.current)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        confirm(selectionRef.current);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  /* `touch-action: none` covers panning and pinching, but iPad Safari can still
     rubber-band on an uncancelled touchmove, and pinch arrives as its own
     gesture events. React's touch listeners are passive, so these go on the element. */
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const stop = (event: Event) => {
      if (event.cancelable) event.preventDefault();
    };
    el.addEventListener('touchmove', stop, { passive: false });
    el.addEventListener('gesturestart', stop);
    el.addEventListener('gesturechange', stop);
    return () => {
      el.removeEventListener('touchmove', stop);
      el.removeEventListener('gesturestart', stop);
      el.removeEventListener('gesturechange', stop);
    };
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (drag.current || target.closest('button')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const bounds = getBounds();
    if (!bounds) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    const p = clampTo({ x: event.clientX, y: event.clientY }, bounds);
    const cur = selectionRef.current;
    const corner = target.closest<HTMLElement>('[data-corner]')?.dataset.corner as Corner | undefined;
    if (cur && corner) {
      const west = corner.includes('w');
      const north = corner.includes('n');
      const fixed = { x: west ? cur.x + cur.width : cur.x, y: north ? cur.y + cur.height : cur.y };
      const at = { x: west ? cur.x : cur.x + cur.width, y: north ? cur.y : cur.y + cur.height };
      /* Where in the handle the finger landed, so the corner does not jump to it. */
      const grab = { x: event.clientX - at.x, y: event.clientY - at.y };
      drag.current = { kind: 'corner', id: event.pointerId, bounds, fixed, grab, before: cur };
      return;
    }
    const inside = cur && p.x >= cur.x && p.x <= cur.x + cur.width && p.y >= cur.y && p.y <= cur.y + cur.height;
    if (cur && adjustingRef.current && inside) {
      drag.current = { kind: 'move', id: event.pointerId, bounds, start: p, before: cur };
      return;
    }
    drag.current = {
      kind: 'draw',
      id: event.pointerId,
      bounds,
      from: p,
      before: adjustingRef.current ? cur : null,
    };
    show({ x: p.x, y: p.y, width: 0, height: 0 });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    const p = { x: event.clientX, y: event.clientY };
    if (d.kind === 'draw') {
      show(span(d.from, clampTo(p, d.bounds)));
    } else if (d.kind === 'corner') {
      show(span(d.fixed, clampTo({ x: p.x - d.grab.x, y: p.y - d.grab.y }, d.bounds)));
    } else {
      const { before: orig, bounds } = d;
      show({
        ...orig,
        x: clamp(orig.x + p.x - d.start.x, bounds.x, bounds.x + bounds.width - orig.width),
        y: clamp(orig.y + p.y - d.start.y, bounds.y, bounds.y + bounds.height - orig.height),
      });
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    const r = selectionRef.current;
    if (d.kind === 'draw' && isTooSmall(r)) {
      show(d.before);
      return;
    }
    if (event.pointerType === 'mouse' && !adjustingRef.current) {
      show(null);
      confirm(r);
      return;
    }
    startAdjusting();
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    show(d.before);
  };

  return {
    selection,
    adjusting,
    canConfirm: !isTooSmall(selection),
    confirm: () => confirm(selectionRef.current),
    surfaceRef,
    surfaceHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onContextMenu: (event: ReactMouseEvent) => event.preventDefault(),
    },
  };
}
