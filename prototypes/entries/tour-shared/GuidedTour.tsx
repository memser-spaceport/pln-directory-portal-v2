'use client';

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';

import s from './GuidedTour.module.scss';

/**
 * The guided tour — one standard object for introducing a new feature.
 *
 * WHEN A TOUR, WHEN A CALLOUT
 *  - One new control, one sentence  → the blue callout (`PostNewsButton`, the
 *    help menu). It points; it does not dim the page.
 *  - A new *flow* across more than one place → this. The scrim is what a flow
 *    earns: the person is being walked somewhere, so the rest steps back.
 *  Never both on one arrival: two announcements at once is none.
 *
 * THE RULES (what "standardized" means)
 *  1. Two to four steps. One step is a callout; five is documentation.
 *  2. Step 1 stands on the page the person arrived on, and its button says what
 *     pressing it does ("Show me"), because it moves them. Later steps: "Next",
 *     and the last one "Got it" — the callout's own word for "seen".
 *  3. Each step: a title naming the thing, and one or two sentences saying what
 *     the screen can't (where a request goes, who sees it). No feature pitch.
 *  4. The host drives between steps (`onNext`), and the tour waits, undrawn,
 *     until the next target exists — a page that is loading is not dimmed.
 *  5. One exit, at every step: ✕ (and Esc). Leaving at any step counts as seen.
 *  6. Pressing the highlighted thing ends the tour: the person has taken over.
 *     Everything else is behind the scrim, and a press there does nothing — a
 *     stray click must not throw the tour away.
 *  7. Only for the people the feature is for (rule: "not for you is absent").
 *  8. Seen once per member, per feature. PROTOTYPE: shown on every load, the
 *     same convention as the callouts, plus a Replay in the review band.
 */
export interface TourStep {
  /** CSS selector of the thing being shown. The first match is used. */
  target: string;
  title: string;
  body: React.ReactNode;
  /** Preferred side of the target; flips when there is no room. */
  placement?: 'bottom' | 'top';
  /** Defaults: "Next", and "Got it" on the last step. */
  nextLabel?: string;
  /** Runs on the primary press, before the next step's target is looked for. */
  onNext?: () => void;
  /** Air between the target and the hole's edge. */
  padding?: number;
  /** The hole's corner, matched to the target's own. */
  radius?: number;
}

export type TourEndReason = 'completed' | 'dismissed' | 'engaged' | 'target-missing';

interface GuidedTourProps {
  /** The eyebrow: "New in <feature>". */
  feature: string;
  steps: TourStep[];
  open: boolean;
  onEnd: (reason: TourEndReason) => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_GAP = 14;
const EDGE = 16;
/** A target that hasn't rendered by now isn't going to; the tour ends quietly. */
const TARGET_TIMEOUT_MS = 15000;

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

/**
 * The part of the target a person can actually see: its box cut down by every
 * ancestor that clips (a scrolling pane, a dialog body). A hole drawn from the
 * raw box shines through whatever covers the target — the dialog's own header,
 * say. Null when nothing of it is showing.
 */
function visibleBox(el: HTMLElement, box: DOMRect) {
  let top = Math.max(box.top, 0);
  let left = Math.max(box.left, 0);
  let right = Math.min(box.right, window.innerWidth);
  let bottom = Math.min(box.bottom, window.innerHeight);
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.overflowY === 'visible' && style.overflowX === 'visible') continue;
    const clip = node.getBoundingClientRect();
    top = Math.max(top, clip.top);
    left = Math.max(left, clip.left);
    right = Math.min(right, clip.right);
    bottom = Math.min(bottom, clip.bottom);
  }
  const width = right - left;
  const height = bottom - top;
  return width > 0 && height > 0 ? { top, left, width, height } : null;
}

/** The scrim as one shape: the viewport, with a rounded hole (evenodd). */
function scrimPath(vw: number, vh: number, r: Rect, radius: number) {
  const rad = Math.min(radius, r.width / 2, r.height / 2);
  const { left: x, top: y, width: w, height: h } = r;
  return (
    `M0 0H${vw}V${vh}H0Z` +
    `M${x + rad} ${y}H${x + w - rad}A${rad} ${rad} 0 0 1 ${x + w} ${y + rad}V${y + h - rad}` +
    `A${rad} ${rad} 0 0 1 ${x + w - rad} ${y + h}H${x + rad}A${rad} ${rad} 0 0 1 ${x} ${y + h - rad}` +
    `V${y + rad}A${rad} ${rad} 0 0 1 ${x + rad} ${y}Z`
  );
}

export function GuidedTour({ feature, steps, open, onEnd }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [card, setCard] = useState<{ top: number; left: number; arrowLeft: number; side: 'bottom' | 'top' } | null>(
    null,
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLSpanElement>(null);
  const titleId = useId();
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const step = steps[index];
  const padding = step?.padding ?? 6;
  const radius = step?.radius ?? 10;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  /* Follow the target every frame while the tour is up: answers stream, fields
     widen, the page scrolls (this app scrolls the body), and a rect measured
     once is wrong a moment later. Undrawn until the target exists (rule 4). */
  useEffect(() => {
    if (!open || !step) return;
    setRect(null);
    let raf = 0;
    let lastTop = NaN;
    let stillSince = 0;
    let scrolledAt = 0;
    const startedAt = performance.now();
    const tick = () => {
      const now = performance.now();
      const el = document.querySelector<HTMLElement>(step.target);
      const box = el?.getBoundingClientRect();
      const found = Boolean(el && box && box.width > 0 && box.height > 0);
      const seen = found ? visibleBox(el!, box!) : null;
      /* Drawn only when the target is whole (or as whole as a screen allows):
         a hole around a sliver points at nothing. */
      const whole = Boolean(seen && box && seen.height >= Math.min(box.height, window.innerHeight * 0.5) - 1);
      if (found && !whole) {
        /* Cut off — by the viewport, or by a scrolling ancestor as inside the
           AI view. Bring it to the middle, but only once it holds still: a
           streaming answer scrolls itself and would undo an earlier scroll. */
        if (box!.top !== lastTop) {
          lastTop = box!.top;
          stillSince = now;
        } else if (now - stillSince > 250 && now - scrolledAt > 700) {
          scrolledAt = now;
          el!.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
      if (seen && whole) {
        const next = {
          top: Math.round(seen.top - padding),
          left: Math.round(seen.left - padding),
          width: Math.round(seen.width + padding * 2),
          height: Math.round(seen.height + padding * 2),
        };
        setRect((prev) => (sameRect(prev, next) ? prev : next));
      } else {
        setRect(null);
        if (performance.now() - startedAt > TARGET_TIMEOUT_MS) {
          onEndRef.current('target-missing');
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, step, padding]);

  /* Place the card: the preferred side, the other one if it doesn't fit, and
     held inside the viewport either way. The arrow keeps pointing at the
     target's centre however far the card had to slide. */
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!rect || !el || !step) return setCard(null);
    const cw = el.offsetWidth;
    const ch = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const roomBelow = vh - (rect.top + rect.height) - CARD_GAP - EDGE;
    const roomAbove = rect.top - CARD_GAP - EDGE;
    const preferred = step.placement ?? 'bottom';
    let side: 'bottom' | 'top' = preferred;
    if (preferred === 'bottom' && roomBelow < ch && roomAbove > roomBelow) side = 'top';
    if (preferred === 'top' && roomAbove < ch && roomBelow > roomAbove) side = 'bottom';
    const rawTop = side === 'bottom' ? rect.top + rect.height + CARD_GAP : rect.top - CARD_GAP - ch;
    const top = Math.max(EDGE, Math.min(rawTop, vh - ch - EDGE));
    const centre = rect.left + rect.width / 2;
    /* PROTOTYPE: the review Comment tab is pinned to the right edge above every
       layer; from tablet up the card keeps clear of it so its ✕ stays pressable. */
    const edgeRight = vw >= 640 ? 56 : EDGE;
    const left = Math.max(EDGE, Math.min(centre - cw / 2, vw - cw - edgeRight));
    const arrowLeft = Math.max(20, Math.min(centre - left, cw - 20));
    setCard((prev) =>
      prev && prev.top === top && prev.left === left && prev.arrowLeft === arrowLeft && prev.side === side
        ? prev
        : { top, left, arrowLeft, side },
    );
  }, [rect, step, index]);

  /* Esc is the ✕. Caught on the window's capture phase and stopped there: the
     AI view under the tour is a Modal that closes on the same key, and leaving
     the tour must not also throw away the screen it was showing. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onEndRef.current('dismissed');
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  /* Rule 6: a press on the highlighted thing is the person taking over. */
  useEffect(() => {
    if (!open || !step) return;
    const onDown = (e: PointerEvent) => {
      const el = document.querySelector<HTMLElement>(step.target);
      if (el && e.target instanceof Node && el.contains(e.target)) onEndRef.current('engaged');
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open, step]);

  /* Each step hands the keyboard its one press. */
  const placed = Boolean(card);
  useEffect(() => {
    if (placed) primaryRef.current?.querySelector('button')?.focus({ preventScroll: true });
  }, [placed, index]);

  if (!open || !step || !rect || typeof document === 'undefined') return null;

  const last = index === steps.length - 1;
  const next = () => {
    step.onNext?.();
    if (last) return onEnd('completed');
    setRect(null);
    setCard(null);
    setIndex(index + 1);
  };

  return createPortal(
    <div className={s.root}>
      <div
        className={s.scrim}
        style={{ clipPath: `path(evenodd, "${scrimPath(window.innerWidth, window.innerHeight, rect, radius)}")` }}
        aria-hidden="true"
      />
      <div
        className={s.ring}
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: radius }}
        aria-hidden="true"
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-labelledby={titleId}
        className={clsx(s.card, card && s.cardPlaced, card?.side === 'top' && s.cardAbove)}
        style={card ? { top: card.top, left: card.left } : undefined}
      >
        <span className={s.arrow} style={card ? { left: card.arrowLeft } : undefined} aria-hidden="true" />
        <div className={s.head}>
          <span className={s.eyebrow}>New in {feature}</span>
          <button type="button" className={s.close} aria-label="Close tour" onClick={() => onEnd('dismissed')}>
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        <h2 id={titleId} className={s.title}>
          {step.title}
        </h2>
        <p className={s.body}>{step.body}</p>
        <div className={s.foot}>
          <span className={s.count}>
            {index + 1} of {steps.length}
          </span>
          <span ref={primaryRef}>
            <Button size="xs" style="fill" variant="primary" onClick={next}>
              {step.nextLabel ?? (last ? 'Got it' : 'Next')}
            </Button>
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
