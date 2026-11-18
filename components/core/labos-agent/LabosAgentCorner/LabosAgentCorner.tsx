'use client';

import { useCallback, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

import { useLabosAgentAnalytics } from '@/analytics/labos-agent.analytics';
import { AiSearchIcon } from '@/components/icons/AiSearchIcon';
import { CommentIcon } from '@/components/icons';
import { useIntroCollapse } from '@/components/page/ai-apps/components/FeedbackFabButton/hooks/useIntroCollapse';
import { FEEDBACK_CAPTURE_IGNORE_ATTR } from '@/components/page/ai-apps/components/screenshot-feedback/capturePage';
import { useShortcutLabels } from '@/components/page/ai-apps/shortcutKeys';
import { useCurrentUserStore } from '@/services/auth/store';
import {
  agentShortcutHint,
  useLabosAgentShortcut,
  useShowsKeyHint,
} from '@/services/labos-agent/hooks/useLabosAgentShortcut';
import { pageContextFromLocation } from '@/services/labos-agent/labos-agent.page-context';
import { useLabosAgentStore } from '@/services/labos-agent/store';

import s from './LabosAgentCorner.module.scss';

interface Props {
  /** The member did not hide the feedback button. `false`: the corner holds the Agent tab only. */
  showFeedback: boolean;
  feedbackOpen: boolean;
  /** The feedback form takes a screenshot: the corner steps out of the picture. */
  feedbackHidden: boolean;
  onOpenFeedback: () => void;
  onCloseFeedback: () => void;
}

/** The page the member is on now. Read at the press, so a query change (`?news=`) needs no re-render. */
const currentPageContext = (uid?: string | null) =>
  pageContextFromLocation(window.location.pathname, window.location.search, uid);

/**
 * The signed-in corner for a member with agent access (LAB-3302): one pill with an Agent tab and a Feedback tab, in
 * the place of the feedback button (dock prototype `home-v2-agent-dock/AgentCorner`). Agent and Ctrl/⌘ J open the
 * agent with the current page as context (`openAgent`). Feedback opens the same drawer as the feedback button.
 * One slot: when one opens, the other closes. The corner steps aside while either is open.
 */
export function LabosAgentCorner({
  showFeedback,
  feedbackOpen,
  feedbackHidden,
  onOpenFeedback,
  onCloseFeedback,
}: Props) {
  const isOpen = useLabosAgentStore((st) => st.isOpen);
  const { openAgent, closeAgent } = useLabosAgentStore((st) => st.actions);
  const uid = useCurrentUserStore((st) => st.currentUser?.uid);
  const analytics = useLabosAgentAnalytics();
  const shortcuts = useShortcutLabels();
  const showsKeyHint = useShowsKeyHint();
  const slotOpen = isOpen || feedbackOpen;
  const isCollapsed = useIntroCollapse(slotOpen);
  const agentRef = useRef<HTMLButtonElement>(null);
  const openedHere = useRef(false);

  const open = useCallback(
    (entryPoint: 'corner' | 'shortcut') => {
      const context = currentPageContext(uid);
      onCloseFeedback();
      openAgent({ context });
      openedHere.current = true;
      analytics.onAgentOpened({ page: context?.page ?? 'none', entryPoint });
    },
    // `analytics` is a stub with new identities each render; the handlers hold no state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, onCloseFeedback, openAgent],
  );

  const onToggle = useCallback(() => {
    if (useLabosAgentStore.getState().isOpen) closeAgent();
    else open('shortcut');
  }, [closeAgent, open]);

  useLabosAgentShortcut({ isEnabled: true, feedbackOpen, onToggle });

  /* One slot: the feedback drawer (button, Alt+F, the (?) menu) takes it from the agent. */
  const prevFeedbackOpen = useRef(feedbackOpen);
  useEffect(() => {
    if (feedbackOpen && !prevFeedbackOpen.current && useLabosAgentStore.getState().isOpen) closeAgent();
    prevFeedbackOpen.current = feedbackOpen;
  }, [feedbackOpen, closeAgent]);

  /* And the agent (any `openAgent` caller) takes it from the drawer. */
  const prevOpen = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !prevOpen.current && feedbackOpen) onCloseFeedback();
    /* Focus goes back to the Agent tab when the panel that it opened closes and leaves focus nowhere. */
    if (!isOpen && prevOpen.current && openedHere.current) {
      openedHere.current = false;
      const active = document.activeElement;
      if (!active || active === document.body) agentRef.current?.focus();
    }
    prevOpen.current = isOpen;
  }, [isOpen, feedbackOpen, onCloseFeedback]);

  return (
    <div
      {...{ [FEEDBACK_CAPTURE_IGNORE_ATTR]: '' }}
      className={clsx(s.corner, (slotOpen || feedbackHidden) && s.cornerHidden)}
      // The same marker as the feedback button: a floating control in this corner stacks above it on phones.
      data-feedback-fab=""
      aria-hidden={slotOpen || undefined}
    >
      <div className={s.dock} role="group" aria-label="Agent and feedback" data-collapsed={isCollapsed || slotOpen}>
        <button
          ref={agentRef}
          type="button"
          className={s.tab}
          aria-label="Agent"
          aria-keyshortcuts="Control+J Meta+J"
          tabIndex={slotOpen ? -1 : undefined}
          onClick={() => open('corner')}
        >
          <AiSearchIcon size={20} />
          <span className={s.tabLabel} aria-hidden>
            Agent
            {showsKeyHint && <kbd className={s.kbd}>{agentShortcutHint(shortcuts.mod)}</kbd>}
          </span>
        </button>
        {showFeedback && (
          <button
            type="button"
            className={clsx(s.tab, s.feedbackTab)}
            aria-label="Give feedback"
            aria-keyshortcuts={shortcuts.openAria}
            tabIndex={slotOpen ? -1 : undefined}
            onClick={onOpenFeedback}
          >
            {/* CommentIcon hardcodes its own 16px box and ignores props. */}
            <CommentIcon />
            <span className={s.tabLabel} aria-hidden>
              Feedback
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
