'use client';

import { clsx } from 'clsx';
import { type RefObject, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDistanceToNow } from 'date-fns';
import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/common/Button/Button';
import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';
import { FeedbackStatusSelector } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackStatusSelector';
import { AI_APP_FEEDBACK_STATUS_LABELS, type AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
import type { AiAppEnvironment, OverlayFeedbackPin } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { useUpdateAiAppFeedbackStatus } from '@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus';
import type { BridgeRect } from '@/ai-apps-bridge/protocol';
// Forum comment rows (avatar, name, time, body), so a thread on a pin reads like
// every other thread in the product — as the prototype does.
import ci from '@/components/page/forum/PostComments/components/CommentItem/CommentItem.module.scss';
// The feedback dialog's card (radius, shadow) and its close disc.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
// The status badge classes, so a reader sees the same pill the author sets.
import st from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackStatusSelector/FeedbackStatusSelector.module.scss';
import { otherEnvLabel, useFeedbackOverlay } from './useFeedbackOverlay';

import s from './CommentMode.module.scss';

/*
 * Comment mode on the live app, ported from the designer prototype
 * (`prototypes/entries/feedback-shared/comments/` — CommentLayer, PinThread,
 * DraftsPanel). The prototype reaches into a same-origin frame; here the app
 * is cross-origin, so the bridge finds each pin's element (`locate`) and
 * reports where it is (`pins:rects`), and LabOS draws over the frame.
 *
 * This is the viewing half: pins, their threads and status, and the pins that
 * can't be drawn. Writing new comments in the mode comes next; until then the
 * card's "Leave feedback" starts today's pick-and-send flow.
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
  pin: OverlayFeedbackPin;
  canManage: boolean;
  currentEnv: AiAppEnvironment;
  isStatusPending: boolean;
  onStatus: (status: AiAppFeedbackStatus) => void;
  onClose?: () => void;
};

/**
 * One pinned comment: status, who and when, what they said, and the element as
 * it looked. The prototype's PinThread without the reply field (replies come
 * with the comments table). Creator and admins triage here; anyone else sees a
 * status only once it says something (New on your own comment says nothing).
 */
export function PinThreadCard({ pin, canManage, currentEnv, isStatusPending, onStatus, onClose }: ThreadProps) {
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
      </div>
    </>
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
  /** The mode is on, and nothing else is using the frame (picking a pin for new feedback). */
  active: boolean;
  openPinUid: string | null;
  onOpenPinChange: (pinUid: string | null) => void;
  onGoToPage: (pagePath: string) => void;
  onExit: () => void;
  /** Until writing in the mode ships: today's pick-and-send flow. */
  onLeaveFeedback: () => void;
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
  onLeaveFeedback,
}: Props) {
  const overlay = useFeedbackOverlay({ iframeRef, appOrigin, frameKey, listening: true, active, pins, currentPath });
  const box = useFrameBox(iframeRef, active);
  const [hoverPinUid, setHoverPinUid] = useState<string | null>(null);
  const [showUnplaced, setShowUnplaced] = useState(false);
  const { mutate: updateStatus, isPending, variables } = useUpdateAiAppFeedbackStatus();

  /* Esc unwinds: an open thread first, then the mode. */
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      if (openPinUid) onOpenPinChange(null);
      else onExit();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, openPinUid, onOpenPinChange, onExit]);

  const unplaced = useMemo(() => {
    const groups = [...overlay.otherPages.entries()];
    return {
      notFound: overlay.notFound,
      otherPages: groups,
      count: overlay.notFound.length + groups.reduce((n, [, list]) => n + list.length, 0),
    };
  }, [overlay.notFound, overlay.otherPages]);

  if (!active || typeof document === 'undefined') return null;

  const setStatus = (pin: OverlayFeedbackPin) => (status: AiAppFeedbackStatus) => {
    if (status !== pin.feedback.status) updateStatus({ appUid, feedbackUid: pin.feedbackUid, status });
  };
  const statusPending = (pin: OverlayFeedbackPin) => isPending && variables?.feedbackUid === pin.feedbackUid;

  const open = overlay.placed.find((p) => p.pin.uid === openPinUid && p.rect);
  const outlined = overlay.placed.find((p) => p.pin.uid === (hoverPinUid ?? openPinUid) && p.rect);

  let threadStyle: { left: number; top: number } | null = null;
  if (open?.rect && box) {
    const point = pointIn(open.rect, open.pin);
    const px = box.left + point.x;
    const flip = px + THREAD_GAP + THREAD_WIDTH > window.innerWidth - 8;
    const left = flip ? Math.max(8, px - THREAD_GAP - THREAD_WIDTH) : px + THREAD_GAP;
    const top = Math.max(8, Math.min(box.top + point.y - 16, window.innerHeight - 320));
    threadStyle = { left, top };
  }

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
              </button>
            );
          })}
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
            pin={open.pin}
            canManage={canManage}
            currentEnv={currentEnv}
            isStatusPending={statusPending(open.pin)}
            onStatus={setStatus(open.pin)}
            onClose={() => onOpenPinChange(null)}
          />
        </div>
      )}

      <section className={clsx(fd.root, s.dock)} aria-label="Feedback on this app">
        <div className={s.top}>
          <span className={s.chip}>{appName}</span>
        </div>
        <div className={s.scroll}>
          <p className={s.hint}>
            {overlay.status === 'waiting'
              ? 'Connecting to the app…'
              : overlay.status === 'unsupported'
                ? 'This app can’t place comments on the page yet; they’re listed below.'
                : canManage
                  ? 'Comments members left on this app. Open one to read it and set its status.'
                  : 'Your comments on this app. You’ll see when the author marks one Shipped.'}
          </p>

          {unplaced.count > 0 && (
            <div className={s.unplaced}>
              <button
                type="button"
                className={s.unplacedToggle}
                aria-expanded={showUnplaced}
                onClick={() => setShowUnplaced((v) => !v)}
              >
                Not on screen ({unplaced.count})
                <span aria-hidden className={s.chevron} data-open={showUnplaced} />
              </button>
              {showUnplaced && (
                <div className={s.unplacedBody}>
                  {unplaced.notFound.length > 0 && (
                    <section className={s.group}>
                      <h3 className={s.groupTitle}>Not found on this page</h3>
                      <ul className={s.list}>
                        {unplaced.notFound.map((pin) => (
                          <li key={pin.uid} className={s.item}>
                            <PinThreadCard
                              pin={pin}
                              canManage={canManage}
                              currentEnv={currentEnv}
                              isStatusPending={statusPending(pin)}
                              onStatus={setStatus(pin)}
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {unplaced.otherPages.map(([page, list]) => (
                    <section key={page} className={s.group}>
                      <div className={s.pageHead}>
                        <h3 className={s.groupTitle}>
                          <code>{page}</code> · {list.length}
                        </h3>
                        <button type="button" className={s.linkButton} onClick={() => onGoToPage(page)}>
                          Go to page
                        </button>
                      </div>
                      <ul className={s.list}>
                        {list.map((pin) => (
                          <li key={pin.uid} className={s.itemCompact}>
                            <span className={s.dot} style={{ background: getAvatarColor(authorOf(pin)) }} aria-hidden>
                              {initials(authorOf(pin))}
                            </span>
                            <span className={s.itemText}>{pin.note || 'No comment'}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className={s.footer}>
          <Button style="link" variant="neutral" size="s" onClick={onExit}>
            Close
          </Button>
          <Button size="s" onClick={onLeaveFeedback}>
            Leave feedback
          </Button>
        </div>
      </section>
    </>,
    document.body,
  );
}
