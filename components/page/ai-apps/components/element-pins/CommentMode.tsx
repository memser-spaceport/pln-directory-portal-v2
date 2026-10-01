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
import {
  commentHtml,
  draftToPinInput,
  generalCommentHtml,
  type CommentDraft,
  type CommentDrafts,
} from './commentDrafts';
import { CommentDock } from './CommentDock';
import { useFeedbackReplies, type ThreadViewer } from './FeedbackReplies';

import s from './CommentMode.module.scss';

/*
 * Comment mode on the live app, ported from the designer prototype
 * (`prototypes/entries/feedback-shared/comments/` — CommentLayer, PinThread,
 * DraftsPanel). The prototype reaches into a same-origin frame; here the app
 * is cross-origin, so the bridge finds each pin's element (`locate`) and
 * reports where it is (`pins:rects`), and LabOS draws over the frame.
 *
 * In the mode, a click in the app drops a pin (the bridge picks; picking stays
 * on while nothing else is open), a small composer beside it queues the
 * comment as a draft, and the dock sends the drafts together: one feedback
 * item per pin, plus an optional comment about the whole app.
 */

const THREAD_WIDTH = 340;
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
  const flip = px + THREAD_GAP + THREAD_WIDTH > window.innerWidth - 8;
  return {
    left: flip ? Math.max(8, px - THREAD_GAP - THREAD_WIDTH) : px + THREAD_GAP,
    top: Math.max(8, Math.min(box.top + point.y - 16, window.innerHeight - minRoom)),
  };
}

type ComposerProps = { onCancel: () => void; onAdd: (note: string) => void; style: { left: number; top: number } };

/**
 * The small card beside a new pin (prototype PinComposer). "Add comment", not
 * Send: the note joins the drafts the member reviews and sends together; the
 * screenshot is looked at (and marked up) there.
 */
function PinComposer({ onCancel, onAdd, style }: ComposerProps) {
  const [text, setText] = useState('');
  const canAdd = text.trim().length > 0;
  return (
    <div className={clsx(fd.root, s.composer)} style={style} role="dialog" aria-label="New comment">
      <textarea
        className={s.composerField}
        rows={3}
        maxLength={5000}
        autoFocus
        aria-label="Comment"
        placeholder="What worked, what didn’t, and what would make this more useful?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canAdd) {
            e.preventDefault();
            onAdd(text);
          }
        }}
      />
      <div className={s.composerFooter}>
        <Button style="border" variant="neutral" size="s" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="s" disabled={!canAdd} onClick={() => onAdd(text)}>
          Add comment
        </Button>
      </div>
    </div>
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
  drafts: CommentDrafts;
  viewerName: string;
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
  drafts,
  viewerName,
  viewer,
  getContext,
}: Props) {
  const overlay = useFeedbackOverlay({ iframeRef, appOrigin, frameKey, listening: true, active, pins, currentPath });
  const box = useFrameBox(iframeRef, active);
  const [hoverPinUid, setHoverPinUid] = useState<string | null>(null);
  const { mutate: updateStatus, isPending, variables } = useUpdateAiAppFeedbackStatus();
  const { mutateAsync: submitFeedback } = useSubmitAiAppFeedback();
  const analytics = useAiAppsAnalytics();
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  /* The "Sent N comments" receipt stays until there is something new to send, or
     the mode is left: a timer let it go by unseen while the pins redrew. */
  if (sentCount > 0 && (!active || drafts.drafts.length > 0 || drafts.general.trim())) setSentCount(0);

  /* ---------- a new pick: the composer, or (thread open) just closing the thread ---------- */

  const draftPinIds = useMemo(
    () => new Set(drafts.drafts.map((d) => d.bridgePinId).filter((id): id is string => Boolean(id))),
    [drafts.drafts],
  );
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
    if (added && active && newest && !draftPinIds.has(newest.id)) {
      if (openPinUid) setDiscardPinId(newest.id);
      else setComposingPinId(newest.id);
    }
  }

  /* A draft can leave the list from another tab (sent or removed there); its
     marker in this tab's app goes with it, or it lingers as a pin with no comment. */
  const prevDraftPinIds = useRef(draftPinIds);
  useEffect(() => {
    const before = prevDraftPinIds.current;
    prevDraftPinIds.current = draftPinIds;
    for (const id of before) {
      if (!draftPinIds.has(id) && id !== composingPinId && elementPins.pins.some((p) => p.id === id)) {
        elementPins.removePin(id);
      }
    }
  }, [draftPinIds, composingPinId, elementPins]);

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

  /* ---------- crops: hosted once each finishes, so a draft survives a reload with its picture ---------- */

  const hosting = useRef(new Set<string>());
  useEffect(() => {
    for (const draft of drafts.drafts) {
      if (draft.cropState !== 'pending' || !draft.bridgePinId || hosting.current.has(draft.id)) continue;
      const pin = elementPins.pins.find((p) => p.id === draft.bridgePinId);
      if (!pin) continue;
      if (pin.crop.status === 'failed') {
        drafts.update(draft.id, { cropState: 'failed' });
        continue;
      }
      if (pin.crop.status !== 'done') continue;
      hosting.current.add(draft.id);
      void hostPinCrops([pin])
        .then(([url]) => drafts.update(draft.id, url ? { cropUrl: url, cropState: 'done' } : { cropState: 'failed' }))
        .catch(() => drafts.update(draft.id, { cropState: 'failed' }))
        .finally(() => hosting.current.delete(draft.id));
    }
  }, [drafts, elementPins.pins]);

  const unplaced = useMemo(() => {
    const groups = [...overlay.otherPages.entries()];
    return {
      notFound: overlay.notFound,
      otherPages: groups,
      count: overlay.notFound.length + groups.reduce((n, [, list]) => n + list.length, 0),
    };
  }, [overlay.notFound, overlay.otherPages]);

  /* ---------- send: one feedback item per pinned comment, plus the whole-app one ---------- */

  const send = async () => {
    if (isSending) return;
    setIsSending(true);
    const context = getContext() ?? undefined;
    let sent = 0;
    let failed = 0;
    for (const draft of drafts.drafts) {
      try {
        await submitFeedback({ appUid, text: commentHtml(draft), pins: [draftToPinInput(draft)], context });
        drafts.remove([draft.id]);
        if (draft.bridgePinId) elementPins.removePin(draft.bridgePinId);
        analytics.onFeedbackSubmitted({
          appUid,
          appName,
          screenshotCount: draft.cropUrl ? 1 : 0,
          hasAnnotations: Boolean(
            draft.annotations && (draft.annotations.strokes.length || draft.annotations.shapes.length),
          ),
          pinCount: 1,
        });
        sent += 1;
      } catch {
        failed += 1;
        analytics.onFeedbackSubmitFailed(appUid);
      }
    }
    const general = drafts.general;
    if (general.trim()) {
      try {
        await submitFeedback({ appUid, text: generalCommentHtml(general), context });
        drafts.clearGeneral(general);
        analytics.onFeedbackSubmitted({ appUid, appName, screenshotCount: 0, hasAnnotations: false });
        sent += 1;
      } catch {
        failed += 1;
        analytics.onFeedbackSubmitFailed(appUid);
      }
    }
    setIsSending(false);
    setSentCount(sent);
    if (failed > 0) {
      toast.error(
        sent > 0
          ? `Sent ${sent}, but ${failed} didn’t go through. They’re still here; try again.`
          : 'Something went wrong. Your comments are still here; try again.',
      );
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

  const composingPin = composingPinId ? elementPins.pins.find((p) => p.id === composingPinId) : null;
  const composingPoint = composingPin ? draftPoint(composingPin.rect, composingPin.point) : null;
  const composerStyle = composingPoint && box ? cardPosition(box, composingPoint, 200) : null;
  const viewerColor = getAvatarColor(viewerName);

  /* This session's crop as it came from the bridge, else the hosted copy (a restored draft). */
  const cropPreview = (draft: CommentDraft) => {
    const pin = draft.bridgePinId ? elementPins.pins.find((p) => p.id === draft.bridgePinId) : null;
    return pin?.crop.status === 'done' ? pin.crop.dataUrl : draft.cropUrl;
  };

  const addDraft = (note: string) => {
    if (!composingPin) return;
    drafts.add({
      note,
      element: composingPin.element,
      point: composingPin.point,
      env: currentEnv,
      cropUrl: null,
      cropState: composingPin.crop.status === 'failed' ? 'failed' : 'pending',
      annotations: null,
      bridgePinId: composingPin.id,
    });
    setComposingPinId(null);
  };

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
          {/* Drafts made this page load: numbered like their rows in the dock. */}
          {drafts.drafts.map((draft, i) => {
            const pin = draft.bridgePinId ? elementPins.pins.find((p) => p.id === draft.bridgePinId) : null;
            const point = pin ? draftPoint(pin.rect, pin.point) : null;
            return point ? (
              <span
                key={draft.id}
                className={clsx(s.pin, s.pinDraft)}
                style={{ left: point.x, top: point.y, ['--pin-color' as string]: viewerColor }}
                aria-label={`Draft comment ${i + 1}`}
              >
                <span className={s.pinFace}>{i + 1}</span>
              </span>
            ) : null;
          })}
          {composingPoint && (
            <span
              className={clsx(s.pin, s.pinDraft, s.pinActive)}
              style={{ left: composingPoint.x, top: composingPoint.y, ['--pin-color' as string]: viewerColor }}
              aria-hidden
            >
              <span className={s.pinFace}>{drafts.drafts.length + 1}</span>
            </span>
          )}
        </div>
      )}

      {open && threadStyle && (
        <div
          className={clsx(fd.root, s.card)}
          style={threadStyle}
          role="dialog"
          aria-label={`Comment by ${authorOf(open.pin)}`}
        >
          <PinThreadCard
            appUid={appUid}
            viewer={viewer}
            pin={open.pin}
            canManage={canManage}
            currentEnv={currentEnv}
            isStatusPending={statusPending(open.pin)}
            onStatus={setStatus(open.pin)}
            onClose={() => onOpenPinChange(null)}
          />
        </div>
      )}

      {composingPin && composerStyle && (
        <PinComposer style={composerStyle} onCancel={cancelComposer} onAdd={addDraft} />
      )}

      <CommentDock
        appName={appName}
        drafts={drafts}
        cropPreview={cropPreview}
        onRemoveDraft={(draft) => {
          drafts.remove([draft.id]);
          if (draft.bridgePinId) elementPins.removePin(draft.bridgePinId);
        }}
        onClearDrafts={() => {
          for (const draft of drafts.drafts) if (draft.bridgePinId) elementPins.removePin(draft.bridgePinId);
          drafts.clear();
        }}
        sentCount={sentCount}
        isSending={isSending}
        onSend={send}
        onClose={onExit}
        status={overlay.status}
        unplaced={unplaced}
        renderUnplacedPin={(pin) => (
          <PinThreadCard
            appUid={appUid}
            viewer={viewer}
            repliesCollapsed
            pin={pin}
            canManage={canManage}
            currentEnv={currentEnv}
            isStatusPending={statusPending(pin)}
            onStatus={setStatus(pin)}
          />
        )}
        onGoToPage={onGoToPage}
      />
    </>,
    document.body,
  );
}
