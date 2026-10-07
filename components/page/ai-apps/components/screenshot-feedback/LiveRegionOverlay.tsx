'use client';

import clsx from 'clsx';
import { type RefObject, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CORNERS, useRegionPicker } from './useRegionPicker';

import s from './LiveRegionOverlay.module.scss';

/** A rectangle in the app frame's viewport (CSS px). */
export type FrameRect = { x: number; y: number; width: number; height: number };

const MIN_SIZE = 8;
/** How far up from the bottom the bar sits; a selection reaching into it sends the bar to the top. */
const BAR_ZONE = 96;
/** A wheel in lines (Firefox with a mouse) scrolls this many px a line. */
const WHEEL_LINE_PX = 16;

/**
 * A drag over the page, as a rectangle inside the app frame: clamped to the
 * frame's box, in the frame's own CSS px. Null when what's left is too small
 * to mean anything (a click, or a drag that missed the app).
 */
export function dragToFrameRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
  frame: { left: number; top: number; width: number; height: number },
): FrameRect | null {
  const clampX = (v: number) => Math.min(Math.max(v - frame.left, 0), frame.width);
  const clampY = (v: number) => Math.min(Math.max(v - frame.top, 0), frame.height);
  const x1 = clampX(Math.min(start.x, end.x));
  const x2 = clampX(Math.max(start.x, end.x));
  const y1 = clampY(Math.min(start.y, end.y));
  const y2 = clampY(Math.max(start.y, end.y));
  if (x2 - x1 < MIN_SIZE || y2 - y1 < MIN_SIZE) return null;
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

/**
 * The same rectangle in the capture's pixels. The bridge reports the viewport it
 * drew (`viewportWidth`, CSS px); the picture is that times its scale.
 */
export function frameRectToCapturePixels(rect: FrameRect, viewportWidth: number, imageWidth: number): FrameRect {
  const scale = imageWidth / Math.max(viewportWidth, 1);
  return { x: rect.x * scale, y: rect.y * scale, width: rect.width * scale, height: rect.height * scale };
}

type Props = {
  /** The app frame: the drag only counts over it. */
  frameRef: RefObject<HTMLIFrameElement | null>;
  onSelect: (rect: FrameRect) => void;
  onCancel: () => void;
  /** Scrolls the app (its bridge) as a wheel at `x`,`y` in the frame would. Without it the wheel does nothing. */
  scrollApp?: (x: number, y: number, dx: number, dy: number) => void;
};

/**
 * Pick a part, over the LIVE app (prototype ai-apps-comments): the page dims, a
 * bar says what to do, and the member drags a rectangle over the app. With a
 * mouse the picture is taken when the drag ends; with a finger or a pen the
 * rectangle stays up to adjust until Use this part. Portalled to the body, above
 * the feedback popup (which hides meanwhile).
 */
export function LiveRegionOverlay({ frameRef, onSelect, onCancel, scrollApp }: Props) {
  const frameBox = () => {
    const r = frameRef.current?.getBoundingClientRect();
    return r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
  };

  const { selection, adjusting, canConfirm, confirm, surfaceRef, surfaceHandlers } = useRegionPicker({
    getBounds: () => {
      const box = frameBox();
      return box ? { x: box.left, y: box.top, width: box.width, height: box.height } : null;
    },
    onConfirm: (sel) => {
      const box = frameBox();
      const rect = box && dragToFrameRect(sel, { x: sel.x + sel.width, y: sel.y + sel.height }, box);
      if (rect) onSelect(rect);
    },
    onCancel,
  });

  /* The layer takes focus so Esc and Enter reach LabOS, not the app frame. */
  useEffect(() => {
    surfaceRef.current?.focus();
  }, [surfaceRef]);

  const scrollRef = useRef(scrollApp);
  useEffect(() => {
    scrollRef.current = scrollApp;
  });

  /* The layer covers the app, so a wheel never reaches it: hand it to the app's
     bridge, one message a frame, at the last pointer position inside the frame
     (a wheel over the dimmed LabOS around it scrolls what's at the frame's
     nearest edge). LabOS itself must not scroll or zoom meanwhile, and React's
     wheel listeners are passive, so this goes on the element. Ctrl/⌘+wheel
     (a trackpad pinch) is swallowed: zooming would move the frame under the drag. */
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    let pending = { x: 0, y: 0, dx: 0, dy: 0 };
    let raf = 0;
    const flush = () => {
      raf = 0;
      const { x, y, dx, dy } = pending;
      pending = { x: 0, y: 0, dx: 0, dy: 0 };
      const box = frameRef.current?.getBoundingClientRect();
      if (!box || (!dx && !dy)) return;
      const clamp = (v: number, size: number) => Math.min(Math.max(v, 0), size);
      scrollRef.current?.(clamp(x - box.left, box.width), clamp(y - box.top, box.height), dx, dy);
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey || !scrollRef.current) return;
      const unit =
        event.deltaMode === 1
          ? WHEEL_LINE_PX
          : event.deltaMode === 2
            ? (frameRef.current?.getBoundingClientRect().height ?? window.innerHeight)
            : 1;
      pending = {
        x: event.clientX,
        y: event.clientY,
        dx: pending.dx + event.deltaX * unit,
        dy: pending.dy + event.deltaY * unit,
      };
      if (!raf) raf = requestAnimationFrame(flush);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [surfaceRef, frameRef]);

  const barOnTop =
    selection !== null &&
    typeof window !== 'undefined' &&
    selection.y + selection.height > window.innerHeight - BAR_ZONE &&
    selection.y > BAR_ZONE;

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div ref={surfaceRef} {...surfaceHandlers} className={s.root} tabIndex={-1} data-testid="live-region-overlay">
      {selection && (selection.width > 0 || selection.height > 0) && (
        <>
          <div
            className={s.selection}
            style={{ left: selection.x, top: selection.y, width: selection.width, height: selection.height }}
          />
          <div className={s.size} style={{ left: selection.x, top: Math.max(0, selection.y - 24) }}>
            {Math.round(selection.width)} × {Math.round(selection.height)}
          </div>
          {adjusting &&
            CORNERS.map((corner) => (
              <div
                key={corner}
                className={s.handle}
                data-corner={corner}
                aria-hidden
                style={{
                  left: corner.includes('w') ? selection.x : selection.x + selection.width,
                  top: corner.includes('n') ? selection.y : selection.y + selection.height,
                }}
              />
            ))}
        </>
      )}
      <div className={clsx(s.bar, barOnTop && s.barTop)} role="status">
        <span className={s.label}>
          {adjusting ? 'Drag a corner to adjust, or draw again' : 'Drag over the part you want'}
        </span>
        {adjusting && (
          <button type="button" className={s.use} disabled={!canConfirm} onClick={confirm}>
            Use this part
          </button>
        )}
        <button type="button" className={s.cancel} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
