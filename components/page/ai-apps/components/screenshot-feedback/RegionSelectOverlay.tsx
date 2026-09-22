'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cropImageToDataUrl } from './captureTabFrame';

import s from './RegionSelectOverlay.module.scss';

const MIN_SIZE = 8;

interface Props {
  freezeSrc: string;
  onSelect: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

type Rect = { x: number; y: number; width: number; height: number };

function containBox(img: HTMLImageElement): Rect {
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  const bounds = img.getBoundingClientRect();
  if (!naturalWidth || !naturalHeight) {
    return { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height };
  }
  const scale = Math.min(bounds.width / naturalWidth, bounds.height / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return {
    x: bounds.left + (bounds.width - width) / 2,
    y: bounds.top + (bounds.height - height) / 2,
    width,
    height,
  };
}

function normalizeDrag(start: { x: number; y: number }, current: { x: number; y: number }, box: Rect): Rect {
  const x0 = Math.min(Math.max(start.x, box.x), box.x + box.width);
  const y0 = Math.min(Math.max(start.y, box.y), box.y + box.height);
  const x1 = Math.min(Math.max(current.x, box.x), box.x + box.width);
  const y1 = Math.min(Math.max(current.y, box.y), box.y + box.height);
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  };
}

export function RegionSelectOverlay({ freezeSrc, onSelect, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<Rect | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      onCancel();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  const finish = useCallback(
    (clientX: number, clientY: number) => {
      const img = imgRef.current;
      const start = dragStart.current;
      dragStart.current = null;
      if (!img || !start) {
        setSelection(null);
        return;
      }
      const box = containBox(img);
      const rect = normalizeDrag(start, { x: clientX, y: clientY }, box);
      setSelection(null);
      if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) return;
      const scaleX = img.naturalWidth / box.width;
      const scaleY = img.naturalHeight / box.height;
      onSelect(
        cropImageToDataUrl(img, {
          x: (rect.x - box.x) * scaleX,
          y: (rect.y - box.y) * scaleY,
          width: rect.width * scaleX,
          height: rect.height * scaleY,
        }),
      );
    },
    [onSelect],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY };
    setSelection({ x: event.clientX, y: event.clientY, width: 0, height: 0 });
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    const img = imgRef.current;
    if (!start || !img) return;
    setSelection(normalizeDrag(start, { x: event.clientX, y: event.clientY }, containBox(img)));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart.current) finish(event.clientX, event.clientY);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={s.root}
      role="dialog"
      aria-label="Select an area to capture"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <img ref={imgRef} className={s.freeze} src={freezeSrc} alt="" draggable={false} />
      <div className={s.hint}>Drag to select any area · Esc to cancel</div>
      <button type="button" className={s.cancel} onClick={onCancel} onPointerDown={(e) => e.stopPropagation()}>
        Cancel
      </button>
      {selection && selection.width > 0 && selection.height > 0 && (
        <div
          className={s.selection}
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height,
          }}
        />
      )}
    </div>,
    document.body,
  );
}
