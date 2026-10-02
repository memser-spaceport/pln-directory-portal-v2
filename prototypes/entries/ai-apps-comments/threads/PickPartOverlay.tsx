'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CAPTURE_IGNORE_ATTR } from './nativeCapture';
import s from './PickPartOverlay.module.scss';

/** A drag smaller than this on either side is a mis-tap, not a selection. */
const MIN_SIZE = 8;

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  onSelect: (area: Area) => void;
  onCancel: () => void;
}

/**
 * "Pick a part": a crosshair surface over the LIVE page — not a frozen picture
 * of it, since nothing has been captured yet. Drag a rectangle; its size shows
 * above it in CSS pixels; let go and that part of the screen is captured
 * natively. The surface claims every touch (`touch-action: none`), so a finger
 * drag never scrolls the page. Esc or Cancel leaves with nothing added.
 *
 * feedback-dev-kit's region picker, minus its corner handles and "Use this
 * part" step for touch — a POC keeps the one gesture.
 */
export function PickPartOverlay({ onSelect, onCancel }: Props) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<Area | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onCancel();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  const toRect = (a: { x: number; y: number }, b: { x: number; y: number }): Area => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  });

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={s.root}
      role="dialog"
      aria-label="Pick a part of the page"
      {...{ [CAPTURE_IGNORE_ATTR]: '' }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, y: e.clientY };
        setRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
      }}
      onPointerMove={(e) => {
        if (start.current) setRect(toRect(start.current, { x: e.clientX, y: e.clientY }));
      }}
      onPointerUp={(e) => {
        const from = start.current;
        start.current = null;
        if (!from) return;
        const area = toRect(from, { x: e.clientX, y: e.clientY });
        if (area.width < MIN_SIZE || area.height < MIN_SIZE) {
          setRect(null);
          return;
        }
        onSelect(area);
      }}
      onPointerCancel={() => {
        start.current = null;
        setRect(null);
      }}
    >
      {rect && rect.width > 0 && rect.height > 0 ? (
        <div className={s.selection} style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}>
          <span className={s.size}>
            {Math.round(rect.width)} × {Math.round(rect.height)}
          </span>
        </div>
      ) : (
        <div className={s.scrim} />
      )}
      <div className={s.bar} onPointerDown={(e) => e.stopPropagation()}>
        <span>Drag over the part you want</span>
        <button type="button" className={s.cancel} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
