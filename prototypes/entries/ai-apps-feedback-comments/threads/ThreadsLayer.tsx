'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';

import { captureElement, cssPath, pickTarget } from '../../feedback-shared/comments/capture';
// The pins, the hover outline and the overlay are the shared comment layer's,
// imported by class so the two prototypes draw one pin.
import cl from '../../feedback-shared/comments/CommentLayer.module.scss';

import { CommentComposer } from './CommentComposer';
import { ThreadCard } from './ThreadCard';
import { describeElement } from './describe';
import type { Attachment, PinTarget, Thread, ThreadStore, Viewer } from './useThreads';
import s from './ThreadsLayer.module.scss';

const THREAD_WIDTH = 340;
const THREAD_GAP = 20;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Composing {
  target: PinTarget;
  text: string;
  attachment: Attachment | null;
}

interface Props {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  /** Bumped by the iframe's onLoad, so pins place once the document exists. */
  frameGeneration: number;
  /** Comment mode is on: clicks on the app place comments, pins are drawn. */
  commenting: boolean;
  onExit: () => void;
  openId: string | null;
  onOpen: (id: string | null) => void;
  /** A row hovered in the panel lights its pin. */
  hoverId: string | null;
  /** Bumped when a row asks to be shown: scrolls the app to that element. */
  focusTick: number;
  viewer: Viewer;
  canManage: boolean;
  store: ThreadStore;
  /** The threads this viewer may see (all for the author, their own for anyone else). */
  threads: Thread[];
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Comment mode over the embedded app — Figma's comment tool. While it is on:
 *
 * - the element under the cursor outlines, and a click anywhere drops a pin there
 *   with a small composer beside it; Post turns the composer into the thread, in
 *   place. The composer's Screenshot takes a real one (pick the tab, drag an
 *   area, draw on it) — attaching it is your choice, as in Figma;
 * - every thread's pin is on the app, and a pin opens its thread (replies, and
 *   the author's New / Reviewed / Shipped);
 * - the app's own clicks are taken by the layer — the mode is a tool. Its
 *   hint and way out live in the card above the feedback bubble (FeedbackFab's
 *   comment state); Esc and the lit bubble also put the app back.
 *
 * Outside the mode nothing is drawn: the app is the app. Threads whose element
 * is gone after a deploy are not drawn; the panel lists them as "Not on the
 * current version".
 *
 * Production caveat: the real app is a cross-origin iframe, so the outline,
 * the pick and the crop run inside the app through dev's starter-kit bridge
 * (`ai-apps-bridge`, the element-pin spike), which already reports element
 * rects and crops. Here the frame is `srcDoc`, so the host reaches in directly.
 */
export function ThreadsLayer(props: Props) {
  const {
    iframeRef,
    frameGeneration,
    commenting,
    onExit,
    openId,
    onOpen,
    hoverId,
    focusTick,
    viewer,
    canManage,
    store,
    threads,
  } = props;
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Box | null>(null);
  const [composing, setComposing] = useState<Composing | null>(null);
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  const doc = () => iframeRef.current?.contentDocument ?? null;

  /** Offset of the frame's viewport inside the overlay (the wrap's 1px border). */
  const frameOffset = () => {
    const o = overlayRef.current?.getBoundingClientRect();
    const f = iframeRef.current?.getBoundingClientRect();
    return o && f ? { dx: f.left - o.left, dy: f.top - o.top } : { dx: 0, dy: 0 };
  };

  const elementAt = (clientX: number, clientY: number): Element | null => {
    const d = doc();
    const f = iframeRef.current?.getBoundingClientRect();
    if (!d || !f) return null;
    const hit = d.elementFromPoint(clientX - f.left, clientY - f.top);
    return hit ? pickTarget(hit) : null;
  };

  const boxOf = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    const { dx, dy } = frameOffset();
    return { left: r.left + dx, top: r.top + dy, width: r.width, height: r.height };
  };

  /** Where a pin sits now, or null when its element is gone. */
  const pointOf = (anchor: string, ox: number, oy: number): { x: number; y: number } | null => {
    if (!anchor) return null;
    const el = doc()?.querySelector(anchor);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const { dx, dy } = frameOffset();
    return { x: r.left + r.width * ox + dx, y: r.top + r.height * oy + dy };
  };

  // Re-place pins on the app's own scroll and on resize.
  useEffect(() => {
    if (!commenting) return;
    const d = doc();
    d?.addEventListener('scroll', bump, true);
    window.addEventListener('resize', bump);
    return () => {
      d?.removeEventListener('scroll', bump, true);
      window.removeEventListener('resize', bump);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commenting, frameGeneration, bump]);

  useLayoutEffect(bump, [commenting, frameGeneration, threads.length, bump]);

  // Leaving the mode drops an unsent comment only if nothing was typed in it.
  useEffect(() => {
    if (commenting) return;
    setHover(null);
    setComposing((cur) => (cur && cur.text.trim() ? cur : null));
  }, [commenting]);

  // Esc: the composer first, then an open thread, then the mode itself.
  useEffect(() => {
    if (!commenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (composing) setComposing(null);
      else if (openId) onOpen(null);
      else onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commenting, composing, openId, onOpen, onExit]);

  const open = threads.find((t) => t.id === openId) ?? null;

  // A row pressed in the panel: bring its element into the app's view first.
  useEffect(() => {
    if (!focusTick || !open?.anchor) return;
    doc()?.querySelector(open.anchor)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const id = setTimeout(bump, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick]);

  // Seeded threads take their picture the first time they are opened.
  useEffect(() => {
    if (!open || open.shot !== null) return;
    const el = open.anchor ? doc()?.querySelector(open.anchor) : null;
    // Not `instanceof HTMLElement`: the element belongs to the frame's window, whose
    // HTMLElement is a different constructor, so that check is always false.
    if (!el) return;
    let cancelled = false;
    captureElement(el as HTMLElement, overlayRef.current).then((shot) => {
      if (!cancelled && shot) store.setShot(open.id, shot);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id, open?.shot]);

  const onMove = (e: React.MouseEvent) => {
    if (composing || openId) {
      setHover(null);
      return;
    }
    const el = elementAt(e.clientX, e.clientY);
    setHover(el ? boxOf(el) : null);
  };

  const onClick = (e: React.MouseEvent) => {
    // A click beside an open thread closes it. Beside a comment you have typed
    // into, it keeps it (Cancel and Esc are the ways out); beside an empty one,
    // it drops that one and this click does nothing more.
    if (openId) {
      onOpen(null);
      return;
    }
    if (composing) {
      if (!composing.text.trim()) setComposing(null);
      return;
    }
    const el = elementAt(e.clientX, e.clientY);
    const d = doc();
    const f = iframeRef.current?.getBoundingClientRect();
    if (!el || !d || !f) return;
    const r = el.getBoundingClientRect();
    const lx = e.clientX - f.left;
    const ly = e.clientY - f.top;
    const target: PinTarget = {
      anchor: {
        anchor: cssPath(el),
        ox: r.width ? (lx - r.left) / r.width : 0.5,
        oy: r.height ? (ly - r.top) / r.height : 0.5,
        x: lx + (d.defaultView?.scrollX ?? 0),
        y: ly + (d.defaultView?.scrollY ?? 0),
      },
      label: describeElement(el),
      shot: null,
    };
    setHover(null);
    setComposing({ target, text: '', attachment: null });
  };

  const post = () => {
    if (!composing || !composing.text.trim()) return;
    const thread = store.add(composing.text.trim(), composing.target, composing.attachment);
    setComposing(null);
    onOpen(thread.id);
  };

  if (!commenting) return null;

  const overlayWidth = overlayRef.current?.clientWidth ?? 0;

  const placement = (p: { x: number; y: number } | null) => {
    // A thread whose element is gone opens in the stage's top-right corner,
    // beside the panel it was opened from.
    if (!p) return { flip: false, style: { left: Math.max(8, overlayWidth - THREAD_WIDTH - 16), top: 16 } };
    const flip = p.x + THREAD_GAP + THREAD_WIDTH > overlayWidth;
    const left = flip ? Math.max(8, p.x - THREAD_GAP - THREAD_WIDTH) : p.x + THREAD_GAP;
    return { flip, style: { left, top: Math.max(0, p.y - 16) } };
  };

  const composingPoint = composing
    ? pointOf(composing.target.anchor.anchor, composing.target.anchor.ox, composing.target.anchor.oy)
    : null;
  const openPoint = open ? pointOf(open.anchor, open.ox, open.oy) : null;

  return (
    <div
      ref={overlayRef}
      className={clsx(cl.overlay, s.overlay)}
      data-tick={tick}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
      onClick={onClick}
    >
      {hover && (
        <div
          className={cl.highlight}
          style={{ left: hover.left, top: hover.top, width: hover.width, height: hover.height }}
          aria-hidden
        />
      )}

      {threads.map((t) => {
        const p = pointOf(t.anchor, t.ox, t.oy);
        if (!p) return null;
        return (
          <button
            key={t.id}
            type="button"
            className={clsx(
              cl.pin,
              t.status === 'IMPLEMENTED' && cl.pinShipped,
              (t.id === openId || t.id === hoverId) && cl.pinActive,
            )}
            style={{ left: p.x, top: p.y, ['--pin-color' as string]: getAvatarColor(t.authorName) }}
            onClick={(e) => {
              e.stopPropagation();
              setHover(null);
              if (composing && !composing.text.trim()) setComposing(null);
              onOpen(t.id === openId ? null : t.id);
            }}
            aria-label={`Thread by ${t.authorName}${t.replies.length ? `, ${t.replies.length} replies` : ''}`}
          >
            <span className={cl.pinFace}>{initials(t.authorName)}</span>
            {t.replies.length > 0 && <span className={cl.pinCount}>{t.replies.length + 1}</span>}
          </button>
        );
      })}

      {composing && composingPoint && (
        <>
          <span
            className={clsx(cl.pin, cl.pinActive, cl.pinDraft)}
            style={{
              left: composingPoint.x,
              top: composingPoint.y,
              ['--pin-color' as string]: getAvatarColor(viewer.name),
            }}
            aria-hidden
          >
            <span className={cl.pinFace}>{initials(viewer.name)}</span>
          </span>
          <CommentComposer
            text={composing.text}
            onText={(text) => setComposing((cur) => (cur ? { ...cur, text } : cur))}
            attachment={composing.attachment}
            onAttachment={(attachment) => setComposing((cur) => (cur ? { ...cur, attachment } : cur))}
            onCancel={() => setComposing(null)}
            onPost={post}
            {...placement(composingPoint)}
          />
        </>
      )}

      {open && (
        <ThreadCard
          thread={open}
          canManage={canManage}
          onReply={(text) => store.reply(open.id, text)}
          onStatus={(status) => store.setStatus(open.id, status)}
          onClose={() => onOpen(null)}
          viewerUid={viewer.uid}
          onEdit={(itemId, text) => store.editText(open.id, itemId, text)}
          onDeleteThread={() => {
            store.deleteThread(open.id);
            onOpen(null);
          }}
          onDeleteReply={(replyId) => store.deleteReply(open.id, replyId)}
          {...placement(openPoint)}
        />
      )}
    </div>
  );
}
