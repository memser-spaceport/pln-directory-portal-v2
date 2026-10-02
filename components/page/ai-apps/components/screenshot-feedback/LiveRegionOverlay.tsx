'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import s from './LiveRegionOverlay.module.scss';

/** A rectangle in the app frame's viewport (CSS px). */
export type FrameRect = { x: number; y: number; width: number; height: number };

const MIN_SIZE = 8;

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
};

/**
 * Pick a part, over the LIVE app (prototype ai-apps-comments): the page dims, a
 * bar says what to do, and the member drags a rectangle over the app. The
 * picture is taken when the drag ends, so what they framed is what they get.
 * Portalled to the body, above the feedback popup (which hides meanwhile).
 */
export function LiveRegionOverlay({ frameRef, onSelect, onCancel }: Props) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [end, setEnd] = useState<{ x: number; y: number } | null>(null);
  /* The frame's box, read once when the drag starts (refs aren't read during render). */
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  /* Esc cancels. The layer takes focus so the key reaches LabOS, not the app frame. */
  useEffect(() => {
    layerRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onCancel();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  const frameBox = () => {
    const r = frameRef.current?.getBoundingClientRect();
    return r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
  };

  const finish = (at: { x: number; y: number }) => {
    const from = start;
    const frame = box;
    setStart(null);
    setEnd(null);
    setBox(null);
    if (!from || !frame) return;
    const rect = dragToFrameRect(from, at, frame);
    if (rect) onSelect(rect);
  };

  const preview = start && end && box ? dragToFrameRect(start, end, box) : null;

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      ref={layerRef}
      className={s.root}
      tabIndex={-1}
      data-testid="live-region-overlay"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setBox(frameBox());
        setStart({ x: e.clientX, y: e.clientY });
        setEnd({ x: e.clientX, y: e.clientY });
      }}
      onPointerMove={(e) => start && setEnd({ x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => finish({ x: e.clientX, y: e.clientY })}
    >
      {preview && box && (
        <div
          className={s.selection}
          style={{ left: box.left + preview.x, top: box.top + preview.y, width: preview.width, height: preview.height }}
        />
      )}
      <div className={s.bar} role="status">
        Drag over the part you want
        <button type="button" className={s.cancel} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
