'use client';

import { useEffect, useRef, useState } from 'react';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { CommentIcon } from '@/components/icons';
import { GiveAiAppFeedbackDialog } from '../GiveAiAppFeedbackDialog';

import s from './FloatingFeedbackButton.module.scss';

/** How long the label stays before the pill settles to the glyph. */
const INTRO_MS = 2200;

interface Props {
  /** When provided (app detail page), preselects this app in the feedback picker. */
  appUid?: string;
  appName?: string;
}

/**
 * Floating "Give feedback" door for the AI Apps surfaces. It opens saying its
 * name, then settles into a 48px glyph in the bottom-right corner. After that,
 * a hover-capable pointer can expand the label again; on touch it stays the
 * glyph. The accessible name is always on the button.
 *
 * Why the label is temporary: on the detail page everything the control covers
 * belongs to the embedded app underneath, so the *resting* state has to be the
 * smallest mark that can still be found. The name is spent once on arrival,
 * then hover (and keyboard focus) can bring it back.
 */
export function FloatingFeedbackButton(props: Props) {
  // The introduction is a mount-time story, but the detail route is one client
  // component reading `use(params)`: React reconciles it at the same position
  // across an [id] change, so navigating app A -> app B re-renders instead of
  // remounting and the label would silently not replay. Keying here rather than
  // at the call sites keeps that from being something a caller can forget.
  return <FeedbackFab key={props.appUid ?? 'list'} {...props} />;
}

function FeedbackFab({ appUid, appName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const introStartedAtRef = useRef<number | null>(null);
  const analytics = useAiAppsAnalytics();
  const { permsSet, isLoading } = usePermissions();
  const isVisible = !isLoading && canViewAiApps(permsSet);

  // Gated on `isVisible` rather than left bare: hooks run before the early
  // return below, so an ungated timer would spend its 2.2s while this renders
  // null and the label would never be seen.
  useEffect(() => {
    if (!isVisible) {
      introStartedAtRef.current = null;
      return;
    }

    introStartedAtRef.current = Date.now();
  }, [isVisible]);

  // Paused while the feedback popover is open — collapsing the anchor mid-use
  // repositions the panel and closes the app picker.
  useEffect(() => {
    if (!isVisible || isOpen || isCollapsed) {
      return;
    }

    const elapsed = introStartedAtRef.current ? Date.now() - introStartedAtRef.current : 0;
    const remaining = Math.max(0, INTRO_MS - elapsed);

    const timer = setTimeout(() => setIsCollapsed(true), remaining);
    return () => clearTimeout(timer);
  }, [isVisible, isOpen, isCollapsed]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div ref={wrapRef} className={s.wrap} data-collapsed={isCollapsed}>
        <button
          type="button"
          className={s.button}
          aria-label="Give feedback"
          onClick={() => {
            analytics.onFeedbackDialogOpened(appUid ? { appUid, appName } : {});
            setIsOpen(true);
          }}
        >
          {/* CommentIcon hardcodes its own 16px box and ignores props. */}
          <CommentIcon />
          <span className={s.label} aria-hidden>
            Give feedback
          </span>
        </button>
      </div>

      <GiveAiAppFeedbackDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appUid={appUid}
        appName={appName}
        anchorRef={wrapRef}
        placement="above"
      />
    </>
  );
}
