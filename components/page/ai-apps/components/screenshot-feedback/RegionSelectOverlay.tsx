'use client';

import clsx from 'clsx';
import { useRef } from 'react';
import { createPortal } from 'react-dom';

import { cropImageToDataUrl } from './captureTabFrame';
import { CORNERS, useRegionPicker } from './useRegionPicker';

import s from './RegionSelectOverlay.module.scss';

/** How far down from the top the hint and buttons sit; a selection reaching into it sends them to the bottom. */
const CONTROLS_ZONE = 72;

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

export function RegionSelectOverlay({ freezeSrc, onSelect, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);

  const { selection, adjusting, canConfirm, confirm, surfaceRef, surfaceHandlers } = useRegionPicker({
    getBounds: () => (imgRef.current ? containBox(imgRef.current) : null),
    onConfirm: (rect) => {
      const img = imgRef.current;
      if (!img) return;
      const box = containBox(img);
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
    onCancel,
  });

  const controlsAtBottom =
    selection !== null &&
    typeof window !== 'undefined' &&
    selection.y < CONTROLS_ZONE &&
    selection.y + selection.height < window.innerHeight - CONTROLS_ZONE;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={surfaceRef} {...surfaceHandlers} className={s.root} role="dialog" aria-label="Select an area to capture">
      <img ref={imgRef} className={s.freeze} src={freezeSrc} alt="" draggable={false} />
      <div className={clsx(s.hint, controlsAtBottom && s.atBottom)}>
        {adjusting ? (
          'Drag a corner to adjust, or draw again'
        ) : (
          <>
            Drag to select any area<span className={s.keyHint}> · Esc to cancel</span>
          </>
        )}
      </div>
      <div className={clsx(s.actions, controlsAtBottom && s.atBottom)}>
        {adjusting && (
          <button type="button" className={s.use} disabled={!canConfirm} onClick={confirm}>
            Use this part
          </button>
        )}
        <button type="button" className={s.cancel} onClick={onCancel}>
          Cancel
        </button>
      </div>
      {selection && selection.width > 0 && selection.height > 0 && (
        <>
          <div
            className={s.selection}
            style={{
              left: selection.x,
              top: selection.y,
              width: selection.width,
              height: selection.height,
            }}
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
    </div>,
    document.body,
  );
}
