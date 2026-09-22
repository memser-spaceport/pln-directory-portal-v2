'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';

import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';

import { captureElement, cssPath, pickTarget } from './capture';
import { DraftsPanel, type DraftItem } from './DraftsPanel';
import { PinComposer } from './PinComposer';
import { PinThread } from './PinThread';
import type { AppComment, CommentAnchor } from './types';
import type { useAppComments, Viewer } from './useAppComments';
import s from './CommentLayer.module.scss';

const THREAD_WIDTH = 340;
const THREAD_GAP = 20;
/** Room kept under a card's top edge on the page, so its footer stays in the window. */
const THREAD_MIN_ROOM = 400;

/**
 * A comment about the whole app or page has no element to hang on. It sits at the
 * top-left corner of the document, which is where a reader looks for "about
 * this, in general" and where a pin cannot cover something being pointed at.
 */
const WHOLE_ANCHOR: CommentAnchor = { anchor: 'body', ox: 0.03, oy: 0.03, x: 16, y: 16 };

let nextDraftId = 1;
const newDraftId = () => `d-${Date.now().toString(36)}-${nextDraftId++}`;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Props {
  /**
   * The embedded app's frame. Absent → the layer works on the page itself: a
   * fixed, full-viewport overlay portalled to the body, hit-testing the host
   * document. Same pins, same composer, same store; only the surface differs.
   */
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  /** Bumped by the iframe's onLoad, so pins place once the document exists. */
  frameGeneration?: number;
  active: boolean;
  onExit: () => void;
  viewer: Viewer;
  canManage: boolean;
  store: ReturnType<typeof useAppComments>;
  onPosted?: () => void;
  /** Who reads a comment left here. Kept on the contract; the review popover says it in its placeholder. */
  audienceNote: string;
  /** What is being commented on, for the popover's chip: the app's name. Defaults to "This app" / "This page". */
  subject?: string;
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
 * Figma-style comment mode over the embedded app.
 *
 * While active, the layer sits over the frame and does three things: outlines
 * the element under the cursor, drops a pin where you click (capturing that
 * element as the comment's picture), and shows the pins already there. Pins
 * are only drawn in this mode — outside it the app is the app, and a row of
 * avatars over a button you are trying to press is in the way.
 *
 * Where it runs is the one thing this prototype cannot show honestly: the
 * production app is a cross-origin iframe, so the host page can neither read
 * its DOM nor paint it. This layer would ship *inside* the app via the starter
 * kit — which already talks to the host over postMessage (`pln-ai-app:route`)
 * — and the host would supply the viewer and store the rows. The mocked frame
 * is `srcDoc`, so here the host reaches in directly; the experience is the
 * same, the wiring is not.
 */
export function CommentLayer(props: Props) {
  const { iframeRef, frameGeneration = 0, active, onExit, viewer, canManage, store, onPosted, subject } = props;
  const isPage = !iframeRef;
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Box | null>(null);
  // Comments started and not yet sent. They outlive the mode: pressing Done with
  // three of them written must not be the way to lose them.
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  // The pin being written right now, in the small composer beside it. "Add
  // comment" queues it into `drafts`; nothing is sent from there.
  const [composing, setComposing] = useState<DraftItem | null>(null);
  // The plain comment: about the app or page as a whole, with no pin.
  const [general, setGeneral] = useState('');
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  // Pins re-place on the app's own scroll and on resize.
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  const doc = () => (isPage ? document : (iframeRef.current?.contentDocument ?? null));

  /** The surface's viewport in client coordinates: the frame's box, or the window's. */
  const surfaceRect = () => (isPage ? { left: 0, top: 0 } : (iframeRef.current?.getBoundingClientRect() ?? null));

  /** portal-v2 scrolls the body, not the document; an app's frame scrolls its window. */
  const scrollOf = (d: Document) =>
    isPage
      ? { x: d.body.scrollLeft + window.scrollX, y: d.body.scrollTop + window.scrollY }
      : { x: d.defaultView?.scrollX ?? 0, y: d.defaultView?.scrollY ?? 0 };

  /** Offset of the frame's viewport inside the overlay (the wrap's 1px border). */
  const frameOffset = () => {
    const o = overlayRef.current?.getBoundingClientRect();
    const f = surfaceRect();
    return o && f ? { dx: f.left - o.left, dy: f.top - o.top } : { dx: 0, dy: 0 };
  };

  const elementAt = (clientX: number, clientY: number): HTMLElement | null => {
    const d = doc();
    const f = surfaceRect();
    if (!d || !f) return null;
    // On the page the overlay itself is the topmost hit, so look through it.
    const hit = d
      .elementsFromPoint(clientX - f.left, clientY - f.top)
      .find((el) => !overlayRef.current?.contains(el));
    return hit ? (pickTarget(hit) as HTMLElement) : d.body;
  };

  const boxOf = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    const { dx, dy } = frameOffset();
    return { left: r.left + dx, top: r.top + dy, width: r.width, height: r.height };
  };

  /** Where a comment's pin sits now — the element if it still exists, else the remembered point. */
  const pointOf = (c: CommentAnchor): { x: number; y: number } | null => {
    const d = doc();
    if (!d) return null;
    const { dx, dy } = frameOffset();
    const el = d.querySelector(c.anchor);
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width * c.ox + dx, y: r.top + r.height * c.oy + dy };
    }
    const sc = scrollOf(d);
    return { x: c.x - sc.x + dx, y: c.y - sc.y + dy };
  };

  // Track the app's scroll and the window's resize while the mode is on.
  useEffect(() => {
    if (!active) return;
    const d = doc();
    d?.addEventListener('scroll', bump, true);
    window.addEventListener('resize', bump);
    return () => {
      d?.removeEventListener('scroll', bump, true);
      window.removeEventListener('resize', bump);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, frameGeneration, bump]);

  useLayoutEffect(bump, [active, frameGeneration, bump]);

  // Esc closes the open thread, then leaves the mode. (A picture open in the
  // editor is a Modal, which takes Esc before this listener ever sees it.)
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (composing) setComposing(null);
      else if (openId) setOpenId(null);
      else onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, composing, openId, onExit]);

  // Leaving the mode closes what is open; queued comments and the plain one
  // stay for when it comes back.
  useEffect(() => {
    if (!active) {
      setOpenId(null);
      setHover(null);
      setComposing(null);
    }
  }, [active]);

  // "Sent" is said once, in the toolbar, and then the toolbar goes back to its job.
  useEffect(() => {
    if (!sentCount) return;
    const id = setTimeout(() => setSentCount(0), 3000);
    return () => clearTimeout(id);
  }, [sentCount]);

  const open = store.comments.find((c) => c.id === openId) ?? null;

  // Seeded comments have no picture until their thread is first opened.
  useEffect(() => {
    if (!open || open.shot !== null) return;
    const el = doc()?.querySelector(open.anchor);
    if (!(el instanceof HTMLElement)) return;
    let cancelled = false;
    captureElement(el, overlayRef.current).then((shot) => {
      if (!cancelled && shot) store.setShot(open.id, shot);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id, open?.shot]);

  const onMove = (e: React.MouseEvent) => {
    if (openId || composing) {
      setHover(null);
      return;
    }
    const el = elementAt(e.clientX, e.clientY);
    setHover(el ? boxOf(el) : null);
  };

  const patchDraft = (id: string, patch: Partial<DraftItem>) =>
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const askFocus = (id: string) => setFocus((cur) => ({ id, n: (cur?.n ?? 0) + 1 }));

  /** The capture lands wherever its comment is by then: still being written, or queued. */
  const applyShot = (id: string, shot: string | null) => {
    setComposing((cur) => (cur?.id === id ? { ...cur, shot, shotPending: false } : cur));
    patchDraft(id, { shot, shotPending: false });
  };

  /** "Add comment" on the pin's composer: queued, numbered, and you keep picking. */
  const queueComposing = () => {
    if (!composing || !composing.text.trim()) return;
    setDrafts((prev) => [...prev, composing]);
    setComposing(null);
  };

  /** Everything goes at once: the plain comment, then each pin as its own feedback row. */
  const sendAll = () => {
    const plain = general.trim();
    if (plain) {
      store.add(WHOLE_ANCHOR, plain, '');
      onPosted?.();
    }
    drafts.forEach((d) => {
      // '' = sent without a picture (none could be captured).
      store.add(d.anchor, d.text.trim(), d.shot ?? '');
      onPosted?.();
    });
    setSentCount(drafts.length + (plain ? 1 : 0));
    setDrafts([]);
    setGeneral('');
    setFocus(null);
  };

  const onClick = (e: React.MouseEvent) => {
    // A click beside an open thread closes it. A click beside a note you have
    // typed into keeps it (Cancel and Esc are the deliberate ways out); beside
    // an empty one it drops that pin and this click does nothing more.
    if (openId) {
      setOpenId(null);
      return;
    }
    if (composing) {
      if (!composing.text.trim()) setComposing(null);
      return;
    }
    const el = elementAt(e.clientX, e.clientY);
    const d = doc();
    if (!el || !d) return;
    const r = el.getBoundingClientRect();
    const f = surfaceRect();
    if (!f) return;
    const lx = e.clientX - f.left;
    const ly = e.clientY - f.top;
    const sc = scrollOf(d);
    const anchor: CommentAnchor = {
      anchor: cssPath(el),
      ox: r.width ? (lx - r.left) / r.width : 0.5,
      oy: r.height ? (ly - r.top) / r.height : 0.5,
      x: lx + sc.x,
      y: ly + sc.y,
    };
    setHover(null);
    // A pin on the page's own background points at nothing in particular, and a
    // picture of the whole page is not a picture of anything — so no capture.
    const pointsAtSomething = !(isPage && (el === d.body || el === d.documentElement));
    const id = newDraftId();
    setComposing({ id, anchor, shot: null, shotPending: pointsAtSomething, text: '' });
    if (pointsAtSomething) {
      captureElement(el, overlayRef.current).then((shot) => applyShot(id, shot));
    }
  };

  if (!active) return null;

  const visible: AppComment[] = canManage ? store.comments : store.comments.filter((c) => c.authorUid === viewer.uid);
  const overlayWidth = overlayRef.current?.clientWidth ?? 0;
  const overlayHeight = overlayRef.current?.clientHeight ?? 0;

  const threadPlacement = (x: number, y: number) => {
    const flip = x + THREAD_GAP + THREAD_WIDTH > overlayWidth;
    const left = flip ? Math.max(8, x - THREAD_GAP - THREAD_WIDTH) : x + THREAD_GAP;
    // In a frame the card may hang below the stage — the page scrolls to it. On
    // the page there is nothing below the viewport to scroll to, so it stays in.
    const top = isPage ? Math.max(8, Math.min(y - 16, overlayHeight - THREAD_MIN_ROOM)) : Math.max(0, y - 16);
    return { flip, style: { left, top } };
  };

  const openPoint = open ? pointOf(open) : null;
  const composingPoint = composing ? pointOf(composing.anchor) : null;

  const layer = (
    <div
      ref={overlayRef}
      className={clsx(s.overlay, isPage && s.overlayPage)}
      data-tick={tick}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
      onClick={onClick}
    >
      {hover && (
        <div
          className={s.highlight}
          style={{ left: hover.left, top: hover.top, width: hover.width, height: hover.height }}
          aria-hidden
        />
      )}

      {visible.map((c) => {
        const p = pointOf(c);
        if (!p) return null;
        return (
          <button
            key={c.id}
            type="button"
            className={clsx(s.pin, c.status === 'IMPLEMENTED' && s.pinShipped, c.id === openId && s.pinActive)}
            style={{ left: p.x, top: p.y, ['--pin-color' as string]: getAvatarColor(c.authorName) }}
            onClick={(e) => {
              e.stopPropagation();
              setHover(null);
              setOpenId(c.id === openId ? null : c.id);
            }}
            aria-label={`Comment by ${c.authorName}`}
          >
            <span className={s.pinFace}>{initials(c.authorName)}</span>
            {c.replies.length > 0 && <span className={s.pinCount}>{c.replies.length + 1}</span>}
          </button>
        );
      })}

      {/* Unsent pins, numbered the way their rows in the panel are. Pressing one
          takes you to its row, the way a pin takes you to its thread. */}
      {drafts.map((d, i) => {
        const n = i + 1;
        const p = pointOf(d.anchor);
        if (!p) return null;
        return (
          <button
            key={d.id}
            type="button"
            className={clsx(s.pin, s.pinDraft)}
            style={{ left: p.x, top: p.y, ['--pin-color' as string]: getAvatarColor(viewer.name) }}
            onClick={(e) => {
              e.stopPropagation();
              setHover(null);
              askFocus(d.id);
            }}
            aria-label={`Unsent comment ${n}`}
          >
            <span className={s.pinFace}>{n}</span>
          </button>
        );
      })}

      {open && openPoint && (
        <PinThread
          comment={open}
          canManage={canManage}
          onReply={(text) => store.reply(open.id, text)}
          onStatus={(status) => store.setStatus(open.id, status)}
          onClose={() => setOpenId(null)}
          {...threadPlacement(openPoint.x, openPoint.y)}
        />
      )}

      {composing && composingPoint && (
        <>
          <span
            className={clsx(s.pin, s.pinActive, s.pinDraft)}
            style={{
              left: composingPoint.x,
              top: composingPoint.y,
              ['--pin-color' as string]: getAvatarColor(viewer.name),
            }}
            aria-hidden
          >
            <span className={s.pinFace}>{drafts.length + 1}</span>
          </span>
          <PinComposer
            text={composing.text}
            onText={(text) => setComposing((cur) => (cur ? { ...cur, text } : cur))}
            onCancel={() => setComposing(null)}
            onAdd={queueComposing}
            {...threadPlacement(composingPoint.x, composingPoint.y)}
          />
        </>
      )}

      {/* Docked at the bottom for as long as the mode is on: it is the mode's
          hint, its queue, its plain-comment field and its way out in one object. */}
      <DraftsPanel
          isPage={isPage}
          subject={subject ?? (isPage ? 'This page' : 'This app')}
          drafts={drafts}
          general={general}
          focus={focus}
          onGeneral={setGeneral}
          onChange={patchDraft}
          onRemove={(id) => setDrafts((prev) => prev.filter((d) => d.id !== id))}
          onClear={() => setDrafts([])}
          sentCount={sentCount}
          onClose={onExit}
          onSend={sendAll}
          onPointerEnter={() => setHover(null)}
        />
    </div>
  );

  return isPage ? createPortal(layer, document.body) : layer;
}
