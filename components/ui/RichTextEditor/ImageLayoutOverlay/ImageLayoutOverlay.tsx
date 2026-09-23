'use client';

import { clsx } from 'clsx';
import { forwardRef, PointerEvent, ReactNode } from 'react';

import { ImageFloat } from '@/utils/richText/imageFloats';

import s from './ImageLayoutOverlay.module.scss';

interface Props {
  rect: { top: number; left: number; width: number; height: number };
  float: ImageFloat | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onHandlePointerDown: (event: PointerEvent<HTMLElement>, directionX: 1 | -1) => void;
  onFloatChange: (float: ImageFloat | null) => void;
  onMove: (direction: 1 | -1) => void;
}

const CORNERS: { key: string; className: string; directionX: 1 | -1 }[] = [
  { key: 'nw', className: s.nw, directionX: -1 },
  { key: 'ne', className: s.ne, directionX: 1 },
  { key: 'sw', className: s.sw, directionX: -1 },
  { key: 'se', className: s.se, directionX: 1 },
];

function MoveIcon(props: { direction: 1 | -1 }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d={props.direction === -1 ? 'M8 12.5V3.5M8 3.5L4.5 7M8 3.5L11.5 7' : 'M8 3.5v9M8 12.5L4.5 9M8 12.5L11.5 9'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WrapIcon(props: { side: 'left' | 'right' | null }) {
  const { side } = props;

  if (!side) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="6" rx="1" fill="currentColor" />
        <rect x="2" y="10" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.55" />
        <rect x="2" y="13" width="8" height="1.5" rx="0.75" fill="currentColor" opacity="0.55" />
      </svg>
    );
  }

  const imageX = side === 'left' ? 2 : 9;
  const textX = side === 'left' ? 9 : 2;

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x={imageX} y="2" width="5" height="8" rx="1" fill="currentColor" />
      <rect x={textX} y="2" width="5" height="1.5" rx="0.75" fill="currentColor" opacity="0.55" />
      <rect x={textX} y="5.25" width="5" height="1.5" rx="0.75" fill="currentColor" opacity="0.55" />
      <rect x={textX} y="8.5" width="5" height="1.5" rx="0.75" fill="currentColor" opacity="0.55" />
      <rect x="2" y="12.5" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

const WRAP_OPTIONS: { key: string; value: ImageFloat | null; label: string; icon: ReactNode }[] = [
  { key: 'left', value: 'left', label: 'Image left, text wraps', icon: <WrapIcon side="left" /> },
  { key: 'none', value: null, label: 'No text wrap', icon: <WrapIcon side={null} /> },
  { key: 'right', value: 'right', label: 'Image right, text wraps', icon: <WrapIcon side="right" /> },
];

/**
 * The frame, corner handles and wrap controls drawn over the selected image.
 *
 * It sits outside the contenteditable — anything rendered inside it would
 * become part of the document Quill is editing — and is placed from the
 * image's own box, so its root takes no pointer events and only the controls
 * are grabbable. The root is forwarded to the hook, which uses it to tell a
 * press on these controls apart from a press that should change the selection.
 */
export const ImageLayoutOverlay = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { rect, float, canMoveUp, canMoveDown, onHandlePointerDown, onFloatChange, onMove } = props;

  // The toolbar-button pattern: cancelling mousedown keeps the editor's own
  // selection and focus where they are, and leaves the click — which a
  // keyboard also produces — to do the work.
  const keepSelection = (event: { preventDefault: () => void }) => event.preventDefault();

  return (
    <div
      ref={ref}
      className={s.root}
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    >
      {CORNERS.map((corner) => (
        <span
          key={corner.key}
          className={clsx(s.handle, corner.className)}
          onPointerDown={(event) => onHandlePointerDown(event, corner.directionX)}
          aria-hidden
        />
      ))}

      <div className={s.wrapBar}>
        <button
          type="button"
          className={s.wrapButton}
          aria-label="Move image up"
          title="Move image up"
          disabled={!canMoveUp}
          onMouseDown={keepSelection}
          onClick={() => onMove(-1)}
        >
          <MoveIcon direction={-1} />
        </button>
        <button
          type="button"
          className={s.wrapButton}
          aria-label="Move image down"
          title="Move image down"
          disabled={!canMoveDown}
          onMouseDown={keepSelection}
          onClick={() => onMove(1)}
        >
          <MoveIcon direction={1} />
        </button>

        <span className={s.separator} aria-hidden />

        {WRAP_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={clsx(s.wrapButton, { [s.wrapButtonActive]: float === option.value })}
            aria-label={option.label}
            aria-pressed={float === option.value}
            title={option.label}
            onMouseDown={keepSelection}
            onClick={() => onFloatChange(option.value)}
          >
            {option.icon}
          </button>
        ))}
      </div>
    </div>
  );
});

ImageLayoutOverlay.displayName = 'ImageLayoutOverlay';
