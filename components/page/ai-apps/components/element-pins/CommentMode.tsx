'use client';

import { clsx } from 'clsx';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDistanceToNow } from 'date-fns';
import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/common/Button/Button';
import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';
import { FeedbackStatusSelector } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackStatusSelector';
import { AI_APP_FEEDBACK_STATUS_LABELS, type AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
import type { AiAppEnvironment, OverlayFeedbackPin } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { useUpdateAiAppFeedbackStatus } from '@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus';
import { useSubmitAiAppFeedback } from '@/services/ai-app-feedback/hooks/useSubmitAiAppFeedback';
import type { FeedbackContext } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { toast } from '@/components/core/ToastContainer';
import type { BridgeRect } from '@/ai-apps-bridge/protocol';
// Forum comment rows (avatar, name, time, body), so a thread on a pin reads like
// every other thread in the product — as the prototype does.
import ci from '@/components/page/forum/PostComments/components/CommentItem/CommentItem.module.scss';
// The feedback dialog's card (radius, shadow) and its close disc.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
// The status badge classes, so a reader sees the same pill the author sets.
import st from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackStatusSelector/FeedbackStatusSelector.module.scss';
import { otherEnvLabel, useFeedbackOverlay } from './useFeedbackOverlay';
import type { ElementPinsController } from './useElementPins';
import { hostPinCrops } from './pinsHtml';
import { commentHtml, toPinInput } from './commentPost';
import { CommentCard } from './CommentCard';
import { CommentsDrawer, type CommentListItem, type CommentWhere } from './CommentsDrawer';
import { useFeedbackReplies, type ThreadViewer } from './FeedbackReplies';

import s from './CommentMode.module.scss';

/*
 * Comment mode on the live app — the Comment tab of the feedback button's
 * panel (prototype ai-apps-comments). The prototype reaches into a same-origin
 * frame; here the app is cross-origin, so the bridge finds each pin's element
 * (`locate`) and reports where it is (`pins:rects`), and LabOS draws over the
 * frame.
 *
 * In the mode, a click in the app drops a pin (the bridge picks; picking stays
 * on while nothing else is open) and a small composer beside it posts the
 * comment at once — one feedback item per pin — then opens its thread. A
 * comment about the app as a whole is the Feedback tab's written form.
 */

const THREAD_WIDTH = 340;
/** The comments panel's width; the app, the button and the cards keep out of it. */
const DRAWER_WIDTH = 380;
/** Below this the panel is hidden (phones), so nothing makes room for it. */
const DRAWER_MIN_VIEWPORT = 640;

/** How much of the window's right edge the comments panel covers now. */
function drawerInset() {
  return typeof window !== 'undefined' && window.innerWidth >= DRAWER_MIN_VIEWPORT ? DRAWER_WIDTH : 0;
}
const THREAD_GAP = 20;

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function authorOf(pin: OverlayFeedbackPin) {
  return pin.feedback.member?.name ?? 'A member';
}

/** The pin's spot: where the member clicked within the element, else its top-left corner. */
function pointIn(rect: BridgeRect, pin: OverlayFeedbackPin) {
  return { x: rect.x + rect.w * (pin.ox ?? 0), y: rect.y + rect.h * (pin.oy ?? 0) };
}

type FrameBox = { left: number; top: number; width: number; height: number };

/** The iframe's box on screen, followed through resizes and page scrolls. */
function useFrameBox(iframeRef: RefObject<HTMLIFrameElement | null>, enabled: boolean): FrameBox | null {
  const [box, setBox] = useState<FrameBox | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const frame = iframeRef.current;
    const update = () => {
      const r = iframeRef.current?.getBoundingClientRect();
      setBox(r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null);
    };
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
  }, [iframeRef, enabled]);
  return box;
}

type ThreadProps = {
  appUid: string;
  pin: OverlayFeedbackPin;
  canManage: boolean;
  currentEnv: AiAppEnvironment;
  isStatusPending: boolean;
  onStatus: (status: AiAppFeedbackStatus) => void;
  onClose?: () => void;
  /** Who is reading; null while signed out (no replies then). */
  viewer: ThreadViewer | null;
  /** The "Not on screen" list: the replies start behind a toggle. */
  repliesCollapsed?: boolean;
};

/**
 * One pinned comment: status, who and when, what they said, the element as it
 * looked, and the conversation under it (the prototype's PinThread). Creator
 * and admins triage here; anyone else sees a status only once it says
 * something (New on your own comment says nothing).
 */
export function PinThreadCard({
  appUid,
  pin,
  canManage,
  currentEnv,
  isStatusPending,
  onStatus,
  onClose,
  viewer,
  repliesCollapsed,
}: ThreadProps) {
  const replies = useFeedbackReplies({
    appUid,
    feedbackUid: pin.feedbackUid,
    commentCount: pin.feedback.commentCount,
    viewer,
    collapsed: repliesCollapsed,
  });
  const status = pin.feedback.status;
  const showStatus = canManage || status !== 'NEW';
  const name = authorOf(pin);
  const envLabel = otherEnvLabel(pin, currentEnv);
  return (
    <>
      <div className={s.threadHead}>
        {showStatus &&
          (canManage ? (
            <FeedbackStatusSelector status={status} isPending={isStatusPending} onStatusSelect={onStatus} />
          ) : (
            <span className={clsx(st.badge, st[`badge_${status}`])}>{AI_APP_FEEDBACK_STATUS_LABELS[status]}</span>
          ))}
        {onClose && (
          <button type="button" className={clsx(fd.closeButton, s.close)} onClick={onClose} aria-label="Close">
            <CloseIcon width={16} height={16} />
          </button>
        )}
      </div>
      <div className={s.thread}>
        <div className={ci.itemRoot}>
          <div className={ci.footer}>
            <span className={ci.Avatar} style={{ backgroundColor: getAvatarColor(name) }} aria-hidden>
              <span className={ci.Fallback}>{initials(name)}</span>
            </span>
            <div className={ci.col}>
              <span className={ci.name}>{name}</span>
              <span className={ci.time}>
                {formatDistanceToNow(new Date(pin.feedback.createdAt), { addSuffix: true })}
                {envLabel && <span className={s.envLabel}>{envLabel}</span>}
              </span>
            </div>
          </div>
          <p className={clsx(ci.postContent, s.body)}>{pin.note || <span className={s.noNote}>No comment</span>}</p>
        </div>
        {pin.cropUrl && (
          <a className={s.shot} href={pin.cropUrl} target="_blank" rel="noopener noreferrer" title="View full size">
            <img src={pin.cropUrl} alt="The part of the app this comment points at" />
          </a>
        )}
        {replies.list}
      </div>
      {replies.field}
    </>
  );
}

type Point = { x: number; y: number };

/** Where a pin made this session sits: its element's rect and the click point, or nowhere. */
function draftPoint(rect: BridgeRect | null, point: { ox: number; oy: number } | null): Point | null {
  if (!rect) return null;
  return { x: rect.x + rect.w * (point?.ox ?? 0), y: rect.y + rect.h * (point?.oy ?? 0) };
}

/** Beside a pin, flipped left when the right side of the window has no room. */
function cardPosition(box: FrameBox, point: Point, minRoom = 320) {
  const px = box.left + point.x;
  const flip = px + THREAD_GAP + THREAD_WIDTH > window.innerWidth - drawerInset() - 8;
  return {
    left: flip ? Math.max(8, px - THREAD_GAP - THREAD_WIDTH) : px + THREAD_GAP,
    top: Math.max(8, Math.min(box.top + point.y - 16, window.innerHeight - minRoom)),
  };
}

type ComposerShot = { status: 'pending' | 'done' | 'failed'; dataUrl: string | null };

type ComposerProps = {
  onCancel: () => void;
  onPost: (note: string, withShot: boolean) => void;
  style: { left: number; top: number };
  /** The element's crop from the bridge; attaching it is the member's choice. */
  shot: ComposerShot;
  posting: boolean;
};

/**
 * The small card beside a new pin (prototype ai-apps-comments): what to say,
 * an optional screenshot of the element, and Post — the comment goes at once.
 */
function PinComposer({ onCancel, onPost, style, shot, posting }: ComposerProps) {
  const [text, setText] = useState('');
  const [withShot, setWithShot] = useState(false);
  const canPost = text.trim().length > 0 && !posting && !(withShot && shot.status === 'pending');
  const post = () => canPost && onPost(text, withShot && shot.status === 'done');
  return (
    <div className={clsx(fd.root, s.composer)} style={style} role="dialog" aria-label="New comment">
      <textarea
        className={s.composerField}
        rows={3}
        maxLength={5000}
        autoFocus
        aria-label="Comment"
        placeholder="Add a comment"
        value={text}
        disabled={posting}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            post();
          }
        }}
      />
      {withShot && shot.status !== 'failed' ? (
        <div className={s.composerShot}>
          {shot.dataUrl ? (
            <img src={shot.dataUrl} alt="Screenshot of the element" />
          ) : (
            <span className={s.composerShotPending}>Preparing screenshot…</span>
          )}
          <button
            type="button"
            className={s.composerShotRemove}
            onClick={() => setWithShot(false)}
            aria-label="Remove screenshot"
            disabled={posting}
          >
            <CloseIcon width={12} height={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={s.composerShotButton}
          onClick={() => setWithShot(true)}
          disabled={posting || shot.status === 'failed'}
          title={shot.status === 'failed' ? 'A screenshot of this element couldn’t be taken' : undefined}
        >
          <CameraIcon />
          Screenshot
        </button>
      )}
      <div className={s.composerFooter}>
        <span className={s.composerAudience}>Only the app’s author and admins see it</span>
        <Button style="border" variant="neutral" size="s" onClick={onCancel} disabled={posting}>
          Cancel
        </Button>
        <Button size="s" disabled={!canPost} onClick={post}>
          {posting ? 'Posting…' : 'Post'}
        </Button>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 5.5A1.5 1.5 0 0 1 4 4h1.2l.8-1.2h4l.8 1.2H12a1.5 1.5 0 0 1 1.5 1.5v5.5A1.5 1.5 0 0 1 12 12.5H4A1.5 1.5 0 0 1 2.5 11V5.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="8.2" r="2.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

type Props = {
  appUid: string;
  appName: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  appOrigin: string | null;
  /** The iframe's remount key (deploy generation). */
  frameKey: string;
  pins: OverlayFeedbackPin[];
  /** Creator or directory admin: every member's pins and the status control. Otherwise the viewer's own, read-only. */
  canManage: boolean;
  currentPath: string | null;
  currentEnv: AiAppEnvironment;
  /** The mode is on. */
  active: boolean;
  openPinUid: string | null;
  onOpenPinChange: (pinUid: string | null) => void;
  onGoToPage: (pagePath: string) => void;
  onExit: () => void;
  /** The bridge, for picking new pins and their crops. */
  elementPins: ElementPinsController;
  viewerName: string;
  /** Every comment on the app (Shipped included), beside the Comment tab. */
  commentCount: number;
  /** The card's Feedback tab: leave the mode and open the written form. */
  onFeedbackTab: () => void;
  /** The signed-in member, for the thread's replies; null when unknown. */
  viewer: ThreadViewer | null;
  getContext: () => FeedbackContext | null;
};

export function CommentMode({
  appUid,
  appName,
  iframeRef,
  appOrigin,
  frameKey,
  pins,
  canManage,
  currentPath,
  currentEnv,
  active,
  openPinUid,
  onOpenPinChange,
  onGoToPage,
  onExit,
  elementPins,
  viewerName,
  viewer,
  commentCount,
  onFeedbackTab,
  getContext,
}: Props) {
  const overlay = useFeedbackOverlay({ iframeRef, appOrigin, frameKey, listening: true, active, pins, currentPath });
  const box = useFrameBox(iframeRef, active);
  const [hoverPinUid, setHoverPinUid] = useState<string | null>(null);
  const { mutate: updateStatus, isPending, variables } = useUpdateAiAppFeedbackStatus();
  const { mutateAsync: submitFeedback } = useSubmitAiAppFeedback();
  const analytics = useAiAppsAnalytics();
  const [posting, setPosting] = useState(false);

  /* ---------- a new pick: the composer, or (thread open) just closing the thread ---------- */

  const newest = elementPins.pins.at(-1) ?? null;
  const [seen, setSeen] = useState({ newestId: newest?.id ?? null, count: elementPins.pins.length });
  const [composingPinId, setComposingPinId] = useState<string | null>(null);
  /** A pick made while a thread was open: it only closes the thread (prototype), so the pin is dropped. */
  const [discardPinId, setDiscardPinId] = useState<string | null>(null);
  if ((newest?.id ?? null) !== seen.newestId || elementPins.pins.length !== seen.count) {
    /* Only a pin that was just added is a new pick. Removing the newest one (sent,
       discarded) exposes an older pin as the newest — that is not a click. */
    const added = elementPins.pins.length > seen.count;
    setSeen({ newestId: newest?.id ?? null, count: elementPins.pins.length });
    if (added && active && newest) {
      if (openPinUid) setDiscardPinId(newest.id);
      else setComposingPinId(newest.id);
    }
  }

  /* Pending until the bridge's list drops it, so nothing here has to reset. */
  const discardPending = Boolean(discardPinId && elementPins.pins.some((p) => p.id === discardPinId));
  useEffect(() => {
    if (!discardPending || !discardPinId) return;
    elementPins.removePin(discardPinId);
    onOpenPinChange(null);
  }, [discardPending, discardPinId, elementPins, onOpenPinChange]);

  /* ---------- picking stays on while the mode is on and nothing else is open ---------- */

  const prevPicking = useRef(elementPins.isPicking);
  const pinCount = useRef(elementPins.pins.length);
  useEffect(() => {
    const wasPicking = prevPicking.current;
    const pickedSomething = elementPins.pins.length > pinCount.current;
    prevPicking.current = elementPins.isPicking;
    pinCount.current = elementPins.pins.length;
    if (!active) {
      if (elementPins.isPicking) elementPins.stopPicking();
      return;
    }
    if (composingPinId || discardPending || elementPins.status !== 'ready' || elementPins.isPicking) return;
    /* Picking ended without a pick: Esc pressed inside the app (the bridge holds
       focus while picking). Same order as Esc here: the thread, then the mode. */
    if (wasPicking && !pickedSomething) {
      if (openPinUid) {
        onOpenPinChange(null);
      } else {
        onExit();
        return;
      }
    }
    elementPins.startPicking();
  }, [active, composingPinId, discardPending, elementPins, openPinUid, onOpenPinChange, onExit]);

  /* Esc with focus in LabOS: the composer, then a thread, then the mode. */
  const cancelComposer = useCallback(() => {
    if (composingPinId) elementPins.removePin(composingPinId);
    setComposingPinId(null);
  }, [composingPinId, elementPins]);
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      if (composingPinId) cancelComposer();
      else if (openPinUid) onOpenPinChange(null);
      else onExit();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, composingPinId, cancelComposer, openPinUid, onOpenPinChange, onExit]);

  /* ---------- the comments panel: one row per item, newest first, with where its element is ---------- */

  const listItems = useMemo((): CommentListItem[] => {
    const where = new Map<string, CommentWhere>();
    if (overlay.status !== 'unsupported') {
      for (const { pin } of overlay.placed) where.set(pin.uid, { kind: 'here' });
      for (const pin of overlay.notFound) where.set(pin.uid, { kind: 'gone' });
      for (const pin of overlay.pending) where.set(pin.uid, { kind: 'locating' });
      for (const [path, list] of overlay.otherPages) {
        for (const pin of list) where.set(pin.uid, { kind: 'otherPage', path });
      }
    }
    /* Older feedback may carry several pins; the item is listed once, by its first. */
    const seenItems = new Set<string>();
    const items: CommentListItem[] = [];
    for (const pin of pins) {
      if (seenItems.has(pin.feedbackUid)) continue;
      seenItems.add(pin.feedbackUid);
      items.push({ pin, where: where.get(pin.uid) ?? { kind: 'unknown' } });
    }
    return items.sort((a, b) => b.pin.feedback.createdAt.localeCompare(a.pin.feedback.createdAt));
  }, [pins, overlay.status, overlay.placed, overlay.notFound, overlay.pending, overlay.otherPages]);

  const selectItem = (item: CommentListItem) => {
    if (item.where.kind === 'otherPage') onGoToPage(item.where.path);
    onOpenPinChange(item.pin.uid);
  };

  /* The app, the button and the card make room for the panel while the mode is on. */
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.style.setProperty('--ai-app-comments-inset', `${DRAWER_WIDTH}px`);
    return () => {
      root.style.removeProperty('--ai-app-comments-inset');
    };
  }, [active]);

  /* ---------- post: one feedback item per comment, sent at once; then its thread opens ---------- */

  /* The item just posted; its thread opens once the pin comes back from the API. */
  const openWhenListed = useRef<string | null>(null);
  useEffect(() => {
    const feedbackUid = openWhenListed.current;
    if (!feedbackUid) return;
    const posted = pins.find((pin) => pin.feedbackUid === feedbackUid);
    if (!posted) return;
    openWhenListed.current = null;
    onOpenPinChange(posted.uid);
  }, [pins, onOpenPinChange]);

  const post = async (note: string, withShot: boolean) => {
    const pin = composingPinId ? elementPins.pins.find((p) => p.id === composingPinId) : null;
    if (!pin || posting) return;
    setPosting(true);
    try {
      const [cropUrl] = withShot ? await hostPinCrops([pin]) : [null];
      const comment = {
        note,
        element: pin.element,
        point: pin.point,
        env: currentEnv,
        cropUrl: cropUrl ?? null,
        annotations: null,
      };
      const created = await submitFeedback({
        appUid,
        text: commentHtml(comment),
        pins: [toPinInput(comment)],
        context: getContext() ?? undefined,
      });
      openWhenListed.current = created?.uid ?? null;
      elementPins.removePin(pin.id);
      setComposingPinId(null);
      analytics.onFeedbackSubmitted({
        appUid,
        appName,
        screenshotCount: comment.cropUrl ? 1 : 0,
        hasAnnotations: false,
        pinCount: 1,
      });
    } catch {
      analytics.onFeedbackSubmitFailed(appUid);
      toast.error('Your comment didn’t post. It’s still here; try again.');
    } finally {
      setPosting(false);
    }
  };

  if (!active || typeof document === 'undefined') return null;

  const setStatus = (pin: OverlayFeedbackPin) => (status: AiAppFeedbackStatus) => {
    if (status !== pin.feedback.status) updateStatus({ appUid, feedbackUid: pin.feedbackUid, status });
  };
  const statusPending = (pin: OverlayFeedbackPin) => isPending && variables?.feedbackUid === pin.feedbackUid;

  const open = overlay.placed.find((p) => p.pin.uid === openPinUid && p.rect);
  const outlined = overlay.placed.find((p) => p.pin.uid === (hoverPinUid ?? openPinUid) && p.rect);
  const threadStyle = open?.rect && box ? cardPosition(box, pointIn(open.rect, open.pin)) : null;
  /* A comment whose element isn't on the page (gone, or unknown without `locate`): its thread
     opens beside the panel instead of at a pin. */
  const floating = !open
    ? listItems.find(
        (item) => item.pin.uid === openPinUid && (item.where.kind === 'gone' || item.where.kind === 'unknown'),
      )
    : undefined;
  const floatingStyle = floating
    ? {
        left: Math.max(8, window.innerWidth - drawerInset() - THREAD_WIDTH - 24),
        top: Math.max(8, (box?.top ?? 0) + 16),
      }
    : null;
  const thread =
    open && threadStyle
      ? { pin: open.pin, style: threadStyle }
      : floating && floatingStyle
        ? { pin: floating.pin, style: floatingStyle }
        : null;

  const composingPin = composingPinId ? elementPins.pins.find((p) => p.id === composingPinId) : null;
  const composingPoint = composingPin ? draftPoint(composingPin.rect, composingPin.point) : null;
  const composerStyle = composingPoint && box ? cardPosition(box, composingPoint, 200) : null;
  const viewerColor = getAvatarColor(viewerName);

  return createPortal(
    <>
      {box && (
        <div
          className={s.layer}
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          data-testid="comment-mode-layer"
        >
          {outlined?.rect && (
            <div
              className={s.highlight}
              style={{ left: outlined.rect.x, top: outlined.rect.y, width: outlined.rect.w, height: outlined.rect.h }}
            />
          )}
          {overlay.placed.map(({ pin, rect }) => {
            if (!rect) return null;
            const point = pointIn(rect, pin);
            const name = authorOf(pin);
            return (
              <button
                key={pin.uid}
                type="button"
                className={clsx(
                  s.pin,
                  pin.feedback.status === 'IMPLEMENTED' && s.pinShipped,
                  pin.uid === openPinUid && s.pinActive,
                )}
                style={{ left: point.x, top: point.y, ['--pin-color' as string]: getAvatarColor(name) }}
                onClick={() => onOpenPinChange(pin.uid === openPinUid ? null : pin.uid)}
                onMouseEnter={() => setHoverPinUid(pin.uid)}
                onMouseLeave={() => setHoverPinUid((uid) => (uid === pin.uid ? null : uid))}
                aria-label={`Comment by ${name}`}
                aria-expanded={pin.uid === openPinUid}
              >
                <span className={s.pinFace}>{initials(name)}</span>
                {/* Messages in the conversation, the comment included (prototype CommentLayer). */}
                {(pin.feedback.commentCount ?? 0) > 0 && (
                  <span className={s.pinCount} aria-label={`${(pin.feedback.commentCount ?? 0) + 1} messages`}>
                    {(pin.feedback.commentCount ?? 0) + 1}
                  </span>
                )}
              </button>
            );
          })}
          {composingPoint && (
            <span
              className={clsx(s.pin, s.pinDraft, s.pinActive)}
              style={{ left: composingPoint.x, top: composingPoint.y, ['--pin-color' as string]: viewerColor }}
              aria-hidden
            >
              <span className={s.pinFace}>{initials(viewerName)}</span>
            </span>
          )}
        </div>
      )}

      {thread && (
        <div
          className={clsx(fd.root, s.card)}
          style={thread.style}
          role="dialog"
          aria-label={`Comment by ${authorOf(thread.pin)}`}
        >
          <PinThreadCard
            key={thread.pin.uid}
            appUid={appUid}
            viewer={viewer}
            pin={thread.pin}
            canManage={canManage}
            currentEnv={currentEnv}
            isStatusPending={statusPending(thread.pin)}
            onStatus={setStatus(thread.pin)}
            onClose={() => onOpenPinChange(null)}
          />
        </div>
      )}

      {composingPin && composerStyle && (
        <PinComposer
          key={composingPin.id}
          style={composerStyle}
          onCancel={cancelComposer}
          onPost={(note, withShot) => void post(note, withShot)}
          shot={{
            status: composingPin.crop.status,
            dataUrl: composingPin.crop.status === 'done' ? composingPin.crop.dataUrl : null,
          }}
          posting={posting}
        />
      )}

      <CommentCard commentCount={commentCount} onFeedbackTab={onFeedbackTab} onClose={onExit} status={overlay.status} />

      <CommentsDrawer items={listItems} openPinUid={openPinUid} onSelect={selectItem} onClose={onExit} />
    </>,
    document.body,
  );
}
