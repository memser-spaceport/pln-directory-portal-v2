'use client';

import { type RefObject, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ElementPin } from './types';

import s from './ElementPins.module.scss';

type FrameBox = { left: number; top: number; width: number; height: number };

function measure(el: HTMLElement | null): FrameBox | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

interface Props {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  pins: ElementPin[];
  activePinId: string | null;
  onPinClick: (pinId: string) => void;
}

/**
 * Numbered markers drawn by LabOS on top of the iframe, from rects the bridge
 * reports. The layer is click-through (the app underneath stays usable); only
 * the badges take clicks. Clipped to the frame so a pin scrolled out of the
 * app's viewport disappears with it. Detached pins (rect `null`) are not drawn.
 *
 * Portalled to <body> with fixed positioning: nothing on the detail page's
 * layout changes, and no ancestor transform can become the containing block.
 */
export function PinOverlay({ iframeRef, pins, activePinId, onPinClick }: Props) {
  const [box, setBox] = useState<FrameBox | null>(null);

  useEffect(() => {
    const frame = iframeRef.current;
    const update = () => setBox(measure(iframeRef.current));
    update();
    const observer = typeof ResizeObserver !== 'undefined' && frame ? new ResizeObserver(update) : null;
    if (frame) observer?.observe(frame);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [iframeRef]);

  if (!box || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={s.overlay}
      style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      data-testid="element-pins-overlay"
    >
      {pins.map((pin, i) =>
        pin.rect ? (
          <div
            key={pin.id}
            className={s.pinBox}
            data-active={pin.id === activePinId}
            style={{ left: pin.rect.x, top: pin.rect.y, width: pin.rect.w, height: pin.rect.h }}
          >
            <button
              type="button"
              className={s.pinBadge}
              onClick={() => onPinClick(pin.id)}
              aria-label={`Pin ${i + 1}${pin.note ? `: ${pin.note}` : ''}`}
            >
              {i + 1}
            </button>
          </div>
        ) : null,
      )}
    </div>,
    document.body,
  );
}
