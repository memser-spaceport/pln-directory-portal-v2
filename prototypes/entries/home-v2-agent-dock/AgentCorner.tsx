'use client';

import { Menu } from '@base-ui-components/react/menu';
import { FEEDBACK_CAPTURE_IGNORE_ATTR } from '@/components/page/ai-apps/components/screenshot-feedback/capturePage';

// The product's menu chrome (base-ui portal, positioning, outside press, Escape), as job-board's ListingMenu uses it.
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

// The mocked LabOS feedback door: production's floating button and drawer, already copy-simplified there.
import {
  FloatingPageFeedbackButton,
  PageFeedbackDrawer,
  usePageFeedback,
} from '../labos-feedback-button/feedback/PageFeedback';

import type { AgentChat } from './AgentV0';
import s from './AgentCorner.module.scss';

const HOME_PAGE = { name: 'Home', path: '/home' };

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
 * The page's bottom-right corner, signed in: Agent, its history, then Give feedback, as Linear puts Agent and
 * its history in the bottom corner. The row is one fixed flex container anchored right, so the feedback
 * button's arrival label and hover label push Agent left instead of running under it.
 *
 * Agent steps aside while its panel is open (the panel's own ✕ and Esc bring it back).
 */
export function AgentCorner({
  agentOpen,
  onOpenAgent,
  chats,
  onOpenChat,
  viewer,
}: {
  agentOpen: boolean;
  onOpenAgent: () => void;
  chats: AgentChat[];
  onOpenChat: (chat: AgentChat) => void;
  viewer: { uid: string; name: string; email: string };
}) {
  const feedback = usePageFeedback();

  return (
    <>
      <div className={s.corner}>
        {!agentOpen && (
          <div className={s.dock} {...{ [FEEDBACK_CAPTURE_IGNORE_ATTR]: '', 'data-native-capture-ignore': '' }}>
            <button
              type="button"
              className={s.agent}
              onClick={onOpenAgent}
              title="Agent (Ctrl J)"
              aria-keyshortcuts="Control+J Meta+J"
            >
              <AgentGlyph />
              Agent
            </button>
            <Menu.Root modal={false}>
              <Menu.Trigger className={s.history} aria-label="Agent history" title="History">
                <HistoryGlyph />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner className={menu.positioner} side="top" align="end" sideOffset={8}>
                  <Menu.Popup className={`${menu.popup} ${s.popup}`}>
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
          </div>
        )}
        <FloatingPageFeedbackButton isOpen={feedback.isOpen} onOpen={feedback.open} />
      </div>
      <PageFeedbackDrawer isOpen={feedback.isOpen} onClose={feedback.close} page={HOME_PAGE} viewer={viewer} />
    </>
  );
}
