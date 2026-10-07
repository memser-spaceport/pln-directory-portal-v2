'use client';

import { clsx } from 'clsx';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDistanceToNow } from 'date-fns';
import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/common/Button/Button';
import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';
import { FeedbackStatusSelector } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackStatusSelector';
import { FeedbackImageLightbox } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackImageLightbox';
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
import { hostImage } from './pinsHtml';
import { AnnotatorModal } from '../screenshot-feedback/AnnotatorModal';
import { flattenAnnotations } from '../screenshot-feedback/flattenAnnotations';
import { hasAnyAnnotation, type AnnotationState } from '../screenshot-feedback/types';
import { commentHtml, toPinInput } from './commentPost';
import { CommentCard } from './CommentCard';
import { CommentsDrawer, type CommentListItem, type CommentWhere } from './CommentsDrawer';
import { useFeedbackReplies, type ThreadViewer } from './FeedbackReplies';
import { ConfirmDelete, EditedMark, InlineEdit, ItemActionsMenu } from './ItemActions';
import { useDeleteFeedbackItem, useEditFeedbackNote } from '@/services/ai-app-feedback/hooks/useFeedbackItemActions';

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
  /** A directory admin: may delete anyone's comment or reply (never edit it). */
  isAdmin?: boolean;
};

function replyCountText(count: number) {
  return count === 1 ? 'Also deletes 1 reply.' : `Also deletes ${count} replies.`;
}

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
  isAdmin = false,
}: ThreadProps) {
  const replies = useFeedbackReplies({
    appUid,
    feedbackUid: pin.feedbackUid,
    commentCount: pin.feedback.commentCount,
    viewer,
    collapsed: repliesCollapsed,
    isAdmin,
  });
  const editNote = useEditFeedbackNote(appUid);
  const deleteItem = useDeleteFeedbackItem(appUid);
  const analytics = useAiAppsAnalytics();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [shotOpen, setShotOpen] = useState(false);
  /* The URL that failed, not a flag: another comment's picture in this card starts fresh. */
  const [failedShot, setFailedShot] = useState<string | null>(null);
  const isOwn = Boolean(viewer && pin.feedback.member?.uid === viewer.uid);
  /* Only comments can be edited (the API refuses FEEDBACK items), and only by their author. */
  const canEdit = isOwn && pin.feedback.kind === 'COMMENT';
  const canDelete = Boolean(viewer) && (isOwn || isAdmin);
  const replyCount = pin.feedback.commentCount ?? 0;
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
        <div className={clsx(ci.itemRoot, s.itemRow)}>
          <div className={ci.footer}>
            <span className={ci.Avatar} style={{ backgroundColor: getAvatarColor(name) }} aria-hidden>
              <span className={ci.Fallback}>{initials(name)}</span>
            </span>
            <div className={ci.col}>
              <span className={ci.name}>{name}</span>
              <span className={ci.time}>
                {formatDistanceToNow(new Date(pin.feedback.createdAt), { addSuffix: true })}
                <EditedMark at={pin.feedback.editedAt} />
                {envLabel && <span className={s.envLabel}>{envLabel}</span>}
              </span>
            </div>
          </div>
          {!editing && !confirmingDelete && (
            <ItemActionsMenu
              label={isOwn ? 'Actions for your comment' : 'Actions for this comment'}
              onEdit={canEdit ? () => setEditing(true) : undefined}
              onDelete={canDelete ? () => setConfirmingDelete(true) : undefined}
            />
          )}
          {editing ? (
            <InlineEdit
              initial={pin.note}
              label="Edit your comment"
              onCancel={() => setEditing(false)}
              onSave={(note) => {
                setEditing(false);
                editNote.mutate({ feedbackUid: pin.feedbackUid, note });
                analytics.onFeedbackCommentEdited({ appUid, feedbackUid: pin.feedbackUid });
              }}
            />
          ) : (
            <p className={clsx(ci.postContent, s.body)}>{pin.note || <span className={s.noNote}>No comment</span>}</p>
          )}
          {confirmingDelete && (
            <ConfirmDelete
              question="Delete comment?"
              detail={replyCount > 0 ? replyCountText(replyCount) : undefined}
              onCancel={() => setConfirmingDelete(false)}
              onConfirm={() => {
                setConfirmingDelete(false);
                deleteItem.mutate(pin.feedbackUid);
                analytics.onFeedbackCommentDeleted({
                  appUid,
                  feedbackUid: pin.feedbackUid,
                  byAuthor: isOwn,
                  replyCount,
                });
                onClose?.();
              }}
            />
          )}
        </div>
        {pin.cropUrl &&
          (failedShot === pin.cropUrl ? (
            <p className={s.shotUnavailable}>Screenshot unavailable</p>
          ) : (
            <button
              type="button"
              className={s.shot}
              onClick={() => setShotOpen(true)}
              aria-label="Open screenshot full size"
              title="View full size"
            >
              <img
                src={pin.cropUrl}
                alt="The part of the app this comment points at"
                onError={() => setFailedShot(pin.cropUrl)}
              />
            </button>
          ))}
        {/* A Modal on <body>: its Escape is captured first, so it closes only the
            picture, never the thread behind it. Marks are already in the picture. */}
        <FeedbackImageLightbox
          image={
            shotOpen && pin.cropUrl
              ? {
                  src: pin.cropUrl,
                  alt: 'The part of the app this comment points at',
                  annotations: null,
                  hasVisibleAnnotations: false,
                  isPinCrop: true,
                }
              : null
          }
          onClose={() => setShotOpen(false)}
        />
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

type Obstacle = { top: number; left: number } | null;

/** Room a thread is given when it has to be raised: enough for the comment and most of its replies. */
const THREAD_ROOM = 400;
/** The tallest a card grows (the card's own CSS limit, which an inline cap would otherwise lift). */
const CARD_MAX_HEIGHT = 520;

/**
 * Where a card can sit from `left`/`top` down: to the window's bottom, or to the
 * top of the Comment card when the two would share a column — a long thread
 * raised and capped (it scrolls) rather than drawn over it.
 */
export function keepClear(left: number, top: number, minRoom: number, obstacle: Obstacle) {
  const overlaps = obstacle !== null && left + THREAD_WIDTH > obstacle.left;
  const floor = overlaps ? obstacle.top - 12 : window.innerHeight - 8;
  const clampedTop = Math.max(8, Math.min(top, floor - minRoom));
  return { left, top: clampedTop, maxHeight: Math.min(CARD_MAX_HEIGHT, Math.max(160, floor - clampedTop)) };
}

/** Beside a pin, flipped left when the right side of the window has no room. */
function cardPosition(box: FrameBox, point: Point, minRoom = 320, obstacle: Obstacle = null) {
  const px = box.left + point.x;
  const flip = px + THREAD_GAP + THREAD_WIDTH > window.innerWidth - drawerInset() - 8;
  const left = flip ? Math.max(8, px - THREAD_GAP - THREAD_WIDTH) : px + THREAD_GAP;
  return keepClear(left, box.top + point.y - 16, minRoom, obstacle);
}

type ComposerShot = { status: 'pending' | 'done' | 'failed'; dataUrl: string | null };

/** The picture a comment posts: the crop, or the crop with the member's marks drawn in. */
export type PostedShot = { dataUrl: string; annotated: boolean };

/**
 * An attached screenshot. The marks stay as data so reopening edits them on the
 * clean crop; `flatUrl` is the crop with them drawn in, made when the editor is
 * saved, so the preview is exactly the picture that will be posted.
 */
type AttachedShot = { annotations: AnnotationState | null; flatUrl: string | null };

type ComposerProps = {
  onCancel: () => void;
  onPost: (note: string, shot: PostedShot | null) => void;
  style: { left: number; top: number; maxHeight?: number };
  /** The element's crop from the bridge; attaching it is the member's choice. */
  shot: ComposerShot;
  posting: boolean;
  /** The annotate dialog opened or closed: comment mode leaves Escape to it meanwhile. */
  onAnnotatingChange: (annotating: boolean) => void;
};

/**
 * The small card beside a new pin (prototype ai-apps-comments): what to say,
 * an optional screenshot of the element, and Post — the comment goes at once.
 * The screenshot opens the annotate dialog on click (LAB-2768), so the member
 * can mark what the comment is about.
 */
function PinComposer({ onCancel, onPost, style, shot, posting, onAnnotatingChange }: ComposerProps) {
  const analytics = useAiAppsAnalytics();
  const [text, setText] = useState('');
  const [attached, setAttached] = useState<AttachedShot | null>(null);
  const [annotating, setAnnotating] = useState(false);
  const withShot = attached !== null;
  const canPost = text.trim().length > 0 && !posting && !annotating && !(withShot && shot.status === 'pending');
  const post = () => {
    if (!canPost) return;
    const dataUrl = attached?.flatUrl ?? (shot.status === 'done' ? shot.dataUrl : null);
    onPost(text, withShot && dataUrl ? { dataUrl, annotated: Boolean(attached?.flatUrl) } : null);
  };

  const setAnnotatingState = (next: boolean) => {
    setAnnotating(next);
    onAnnotatingChange(next);
  };
  /* The dialog goes with the composer (Cancel, the mode closing, the pin removed
     elsewhere): comment mode must get Escape back. */
  const onAnnotatingChangeRef = useRef(onAnnotatingChange);
  useEffect(() => {
    onAnnotatingChangeRef.current = onAnnotatingChange;
  });
  useEffect(() => () => onAnnotatingChangeRef.current(false), []);

  const openAnnotator = () => {
    if (posting || shot.status !== 'done') return;
    analytics.onFeedbackScreenshotEditOpened({ source: 'comment' });
    setAnnotatingState(true);
  };
  const saveAnnotations = async (next: AnnotationState) => {
    const annotated = hasAnyAnnotation(next);
    analytics.onFeedbackScreenshotEditSaved({ hasAnnotations: annotated, source: 'comment' });
    if (!annotated || !shot.dataUrl) {
      setAttached({ annotations: null, flatUrl: null });
    } else {
      try {
        setAttached({ annotations: next, flatUrl: await flattenAnnotations(shot.dataUrl, next) });
      } catch {
        toast.error('Your drawing couldn’t be added to the screenshot. Try again.');
      }
    }
    setAnnotatingState(false);
  };

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
        disabled={posting || annotating}
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
            <button
              type="button"
              className={s.composerShotOpen}
              onClick={openAnnotator}
              disabled={posting}
              aria-label="Annotate screenshot"
              title="Draw on the screenshot to show what you mean"
            >
              <img src={attached?.flatUrl ?? shot.dataUrl} alt="Screenshot of the element" />
              <span className={s.composerShotHint} aria-hidden>
                {attached?.flatUrl ? 'Edit drawing' : 'Click to draw on it'}
              </span>
            </button>
          ) : (
            <span className={s.composerShotPending}>Preparing screenshot…</span>
          )}
          <button
            type="button"
            className={s.composerShotRemove}
            onClick={() => setAttached(null)}
            aria-label="Remove screenshot"
            disabled={posting || annotating}
          >
            <CloseIcon width={12} height={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={s.composerShotButton}
          onClick={() => setAttached({ annotations: null, flatUrl: null })}
          disabled={posting || shot.status === 'failed'}
          title={
            shot.status === 'failed'
              ? 'A screenshot of this element couldn’t be taken'
              : 'Attach a screenshot of this element. Everyone who can open this app can see it.'
          }
        >
          <CameraIcon />
          Screenshot
        </button>
      )}
      {/* Its own line: beside the buttons it wrapped to three narrow ones. */}
      <p className={s.composerAudience}>Everyone who can open this app can see it.</p>
      <div className={s.composerFooter}>
        <Button style="border" variant="neutral" size="s" onClick={onCancel} disabled={posting}>
          Cancel
        </Button>
        <Button size="s" disabled={!canPost} onClick={post}>
          {posting ? 'Posting…' : 'Post'}
        </Button>
      </div>
      {annotating && shot.dataUrl && (
        <AnnotatorModal
          imageSrc={shot.dataUrl}
          initialAnnotations={attached?.annotations ?? undefined}
          onDiscard={() => setAnnotatingState(false)}
          onAdd={(next) => void saveAnnotations(next)}
        />
      )}
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
  /** A directory admin: may delete anyone's comment (moderation). The app's creator may not. */
  isAdmin?: boolean;
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
  isAdmin = false,
}: Props) {
  const overlay = useFeedbackOverlay({ iframeRef, appOrigin, frameKey, listening: true, active, pins, currentPath });
  const box = useFrameBox(iframeRef, active);
  const [hoverPinUid, setHoverPinUid] = useState<string | null>(null);
  const { mutate: updateStatus, isPending, variables } = useUpdateAiAppFeedbackStatus();
  const { mutateAsync: submitFeedback } = useSubmitAiAppFeedback();
  const analytics = useAiAppsAnalytics();
  const [posting, setPosting] = useState(false);
  /** The composer's annotate dialog is open: Escape is its, not the mode's. */
  const [annotating, setAnnotating] = useState(false);
  /** The Comment card's corner on screen; threads keep clear of it. */
  const [cardBounds, setCardBounds] = useState<Obstacle>(null);

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
      /* The dialog handles its own Escape, but lets one through from a text
         label it's editing — that must not throw the comment away. */
      if (annotating) return;
      event.preventDefault();
      if (composingPinId) cancelComposer();
      else if (openPinUid) onOpenPinChange(null);
      else onExit();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, annotating, composingPinId, cancelComposer, openPinUid, onOpenPinChange, onExit]);

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

  const post = async (note: string, shot: PostedShot | null) => {
    const pin = composingPinId ? elementPins.pins.find((p) => p.id === composingPinId) : null;
    if (!pin || posting) return;
    setPosting(true);
    try {
      const cropUrl = shot ? await hostImage(shot.dataUrl) : null;
      /* Attached but not hosted: posting now would drop the screenshot without a word. */
      if (shot && !cropUrl) throw new Error('The screenshot could not be uploaded');
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
        kind: 'COMMENT',
      });
      openWhenListed.current = created?.uid ?? null;
      elementPins.removePin(pin.id);
      setComposingPinId(null);
      analytics.onFeedbackSubmitted({
        appUid,
        appName,
        screenshotCount: comment.cropUrl ? 1 : 0,
        hasAnnotations: shot?.annotated ?? false,
        pinCount: 1,
      });
      analytics.onFeedbackCommentSubmitted({
        appUid,
        hasScreenshot: Boolean(comment.cropUrl),
        hasAnnotations: shot?.annotated ?? false,
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
  const threadStyle =
    open?.rect && box ? cardPosition(box, pointIn(open.rect, open.pin), THREAD_ROOM, cardBounds) : null;
  /* A comment whose element isn't on the page (gone, or unknown without `locate`): its thread
     opens beside the panel instead of at a pin. */
  const floating = !open
    ? listItems.find(
        (item) => item.pin.uid === openPinUid && (item.where.kind === 'gone' || item.where.kind === 'unknown'),
      )
    : undefined;
  const floatingStyle = floating
    ? keepClear(
        Math.max(8, window.innerWidth - drawerInset() - THREAD_WIDTH - 24),
        Math.max(8, (box?.top ?? 0) + 16),
        THREAD_ROOM,
        cardBounds,
      )
    : null;
  const thread =
    open && threadStyle
      ? { pin: open.pin, style: threadStyle }
      : floating && floatingStyle
        ? { pin: floating.pin, style: floatingStyle }
        : null;

  const composingPin = composingPinId ? elementPins.pins.find((p) => p.id === composingPinId) : null;
  const composingPoint = composingPin ? draftPoint(composingPin.rect, composingPin.point) : null;
  const composerStyle = composingPoint && box ? cardPosition(box, composingPoint, 200, cardBounds) : null;
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
            isAdmin={isAdmin}
          />
        </div>
      )}

      {composingPin && composerStyle && (
        <PinComposer
          key={composingPin.id}
          style={composerStyle}
          onCancel={cancelComposer}
          onPost={(note, shot) => void post(note, shot)}
          onAnnotatingChange={setAnnotating}
          shot={{
            status: composingPin.crop.status,
            dataUrl: composingPin.crop.status === 'done' ? composingPin.crop.dataUrl : null,
          }}
          posting={posting}
        />
      )}

      <CommentCard
        commentCount={commentCount}
        onFeedbackTab={onFeedbackTab}
        onClose={onExit}
        status={overlay.status}
        onBoundsChange={setCardBounds}
      />

      <CommentsDrawer items={listItems} openPinUid={openPinUid} onSelect={selectItem} onClose={onExit} />
    </>,
    document.body,
  );
}
