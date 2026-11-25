'use client';

/**
 * The agent's history menu, forked from home-v2-agent-dock's AgentHistoryMenu (trigger, popup and rows are
 * its classes, imported) so that entry stays untouched. One addition (LAB-3389, user 2026-11-25: "link to ai
 * chats"): a footer row, "All AI Search chats", that opens AI Search in a new tab with its History rail open.
 *
 * The agent's own recent chats stay above it, under their own title. The two histories are separate (the
 * ticket's assumption), so the footer is a door to the other list, not more of this one.
 */

import { Menu } from '@base-ui-components/react/menu';
import { ArrowUpRight } from '@phosphor-icons/react';

import { AiSearchIcon } from '@/components/icons/AiSearchIcon';
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

import type { AgentChat } from '../home-v2-agent-dock/AgentV0';
import c from '../home-v2-agent-dock/AgentCorner.module.scss';

import s from './Agent.module.scss';

/** The ai-search-page prototype with its History rail open (`?history=1`, read on arrival). */
export const AI_SEARCH_HISTORY_URL = '/prototypes/ai-search-page?history=1';

function HistoryGlyph() {
  return (
    <svg className={c.glyph} viewBox="0 0 24 24" fill="none" aria-hidden>
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

export function AgentHistory({ chats, onOpenChat }: { chats: AgentChat[]; onOpenChat: (chat: AgentChat) => void }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={c.historyInHead} aria-label="Agent history" title="History">
        <HistoryGlyph />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={menu.positioner} side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className={`${menu.popup} ${c.popup} ${c.popupOverPanel}`}>
            <div className={menu.popupTitle}>Recent chats</div>
            {chats.map((chat) => (
              <Menu.Item key={chat.id} className={`${menu.item} ${c.chat}`} onClick={() => onOpenChat(chat)}>
                <span className={c.chatTitle}>{chat.title}</span>
                <span className={c.chatWhen}>{chat.when}</span>
              </Menu.Item>
            ))}
            <div className={s.historyRule} role="separator" />
            <Menu.Item
              className={`${menu.item} ${s.historyAiSearch}`}
              onClick={() => window.open(AI_SEARCH_HISTORY_URL, '_blank', 'noopener')}
              aria-label="All AI Search chats (opens in a new tab)"
            >
              <AiSearchIcon size={16} />
              <span className={s.historyAiSearchLabel}>All AI Search chats</span>
              <ArrowUpRight weight="bold" aria-hidden className={s.historyAiSearchArrow} />
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
