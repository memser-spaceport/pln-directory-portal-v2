'use client';

import { Menu } from '@base-ui-components/react/menu';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { CommentGlyph } from '../nav-shared/icons';
import tabs from '@/components/page/ai-apps/components/FeedbackTabs/FeedbackTabs.module.scss';
import { FEEDBACK_CAPTURE_IGNORE_ATTR } from '@/components/page/ai-apps/components/screenshot-feedback/capturePage';

// The product's menu chrome (base-ui portal, positioning, outside press, Escape), as job-board's ListingMenu uses it.
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

import type { AgentChat } from './AgentV0';
import s from './AgentCorner.module.scss';

/** How long the closed tabs show their labels before settling to glyphs (production's INTRO_MS). */
const LABELS_INTRO_MS = 2200;

/** Linear's agent mark: an outlined pointer. Exported so the panel's header wears the same one. */
export function AgentGlyph() {
  return (
    <svg className={s.glyph} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.04 4.69a.5.5 0 0 1 .65-.65l16 6.5a.5.5 0 0 1-.06.95l-6.13 1.58a2 2 0 0 0-1.43 1.43l-1.58 6.13a.5.5 0 0 1-.95.06z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function HistoryGlyph() {
  return (
    <svg className={s.glyph} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * The page's bottom-right corner, signed in: the closed state of the Agent | Feedback drawer, drawn as the
 * same two tabs on one pill track (user, 2026-11-11: "make them tabs when they are closed as well", with a
 * segmented All | Images | Video reference). Neither tab is selected while the drawer is closed; a press
 * opens the drawer on that tab, whose title is the same pair (`SlotTabs`). While the drawer is open the
 * corner steps aside, as it covers it anyway.
 *
 * Replaces production's floating brand feedback disc and the Agent + history pill beside it. History moved
 * into the Agent panel's header (`AgentHistoryMenu`), so the closed state is only the two tabs.
 */
export function AgentCorner({
  slotOpen,
  onOpenAgent,
  onOpenFeedback,
}: {
  /** The Agent panel or the feedback drawer is open. */
  slotOpen: boolean;
  onOpenAgent: () => void;
  onOpenFeedback: () => void;
}) {
  /* Production's FloatingFeedbackButton timing: the labels say their names on arrival, then settle to the
     glyphs; hover or keyboard focus brings one tab's label back. Kept mounted (hidden) while the drawer is
     open, so closing it doesn't replay the arrival. */
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setCollapsed(true), LABELS_INTRO_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={clsx(s.corner, slotOpen && s.cornerHidden)} aria-hidden={slotOpen || undefined}>
      <div
        className={s.dock}
        role="group"
        aria-label="Agent and feedback"
        data-collapsed={collapsed}
        {...{ [FEEDBACK_CAPTURE_IGNORE_ATTR]: '', 'data-native-capture-ignore': '' }}
      >
        <button
          type="button"
          className={s.agent}
          onClick={onOpenAgent}
          aria-label="Agent"
          aria-keyshortcuts="Control+J Meta+J"
          tabIndex={slotOpen ? -1 : undefined}
        >
          <AgentGlyph />
          <span className={s.tabLabel} aria-hidden>
            Agent
          </span>
        </button>
        <button
          type="button"
          className={clsx(s.agent, s.feedbackTab)}
          onClick={onOpenFeedback}
          aria-label="Give feedback"
          tabIndex={slotOpen ? -1 : undefined}
        >
          <CommentGlyph />
          <span className={s.tabLabel} aria-hidden>
            Feedback
          </span>
        </button>
      </div>
    </div>
  );
}

/** Recent chats, in the Agent panel's header beside New chat (moved there from the corner). */
export function AgentHistoryMenu({ chats, onOpenChat }: { chats: AgentChat[]; onOpenChat: (chat: AgentChat) => void }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={s.historyInHead} aria-label="Agent history" title="History">
        <HistoryGlyph />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={menu.positioner} side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className={`${menu.popup} ${s.popup} ${s.popupOverPanel}`}>
            <div className={menu.popupTitle}>Recent chats</div>
            {chats.map((chat) => (
              <Menu.Item key={chat.id} className={`${menu.item} ${s.chat}`} onClick={() => onOpenChat(chat)}>
                <span className={s.chatTitle}>{chat.title}</span>
                <span className={s.chatWhen}>{chat.when}</span>
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export type SlotTab = 'agent' | 'feedback';

/**
 * Agent | Feedback, as the title of whichever drawer holds the slot (user, 2026-11-11: "make Agent/Feedback
 * like a tabs switch"). Production's own segmented control, FeedbackTabs (stylesheet verbatim), the one the
 * AI Apps drawer uses for Feedback | Comments. Both drawers draw it in the same place at the same width and
 * open without a slide, so a press reads as switching tabs in one drawer.
 */
export function SlotTabs({ active, onSelect }: { active: SlotTab; onSelect: (tab: SlotTab) => void }) {
  return (
    <div className={clsx(tabs.root, s.slotTrack)} role="tablist" aria-label="Agent or feedback">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'agent'}
        className={clsx(tabs.tab, s.slotTab, active === 'agent' && tabs.active)}
        onClick={() => onSelect('agent')}
        title="Agent (Ctrl J)"
      >
        <AgentGlyph />
        Agent
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === 'feedback'}
        className={clsx(tabs.tab, s.slotTab, active === 'feedback' && tabs.active)}
        onClick={() => onSelect('feedback')}
      >
        <CommentGlyph />
        Feedback
      </button>
    </div>
  );
}
