'use client';

import { useEffect, useRef, useState } from 'react';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { CommentIcon } from '@/components/icons';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';
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
 * name and then settles into a 48px glyph in the bottom-right corner.
 *
 * Why the label is temporary: on the detail page everything the control covers
 * belongs to the embedded app underneath, so the *resting* state has to be the
 * smallest mark that can still be found. But a bare glyph in a corner has to be
 * guessed at once, by everyone, and the cheapest place to answer that is on
 * arrival — the name is spent once, at the moment the page is new, and then the
 * space goes back to the app. After that the tooltip and the accessible name
 * carry it; nothing is ever hidden behind a press.
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
  const analytics = useAiAppsAnalytics();
  const { permsSet, isLoading } = usePermissions();
  const isVisible = !isLoading && canViewAiApps(permsSet);

  // Gated on `isVisible` rather than left bare: hooks run before the early
  // return below, so an ungated timer would spend its 2.2s while this renders
  // null and the label would never be seen.
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const timer = setTimeout(() => setIsCollapsed(true), INTRO_MS);
    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* The ref and the fixed positioning both belong on this wrapper, outside
          CustomTooltip: it clones its trigger with a ref of its own (overwriting
          any we passed, which would silently unanchor the panel) and nests an
          unstyled div of its own between here and the button. */}
      <div ref={wrapRef} className={s.wrap} data-collapsed={isCollapsed}>
        <CustomTooltip
          // CustomTooltip otherwise only speaks for truncated text, and a
          // 48px disc is never truncated. It stays mounted across the collapse
          // rather than switching on afterwards: flipping this prop swaps the
          // whole trigger tree, remounting the button mid-transition.
          forceTooltip
          content="Give feedback"
          trigger={
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
          }
        />
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
