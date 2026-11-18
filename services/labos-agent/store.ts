import { create } from 'zustand';

import type { LabosAgentChat, LabosAgentOpenContext, LabosAgentTurn } from '@/types/labos-agent.types';
import { generateUUID } from '@/utils/common.utils';

/** One key per context: one chat per story, one for Home, one for no context. */
export function chatKey(context: LabosAgentOpenContext | null): string {
  if (!context) return 'none';
  if (context.page === 'news-story') return `news-story:${context.newsUid}`;
  if (context.page === 'intro') return `intro:${context.introTarget.type}:${context.introTarget.uid}`;
  return context.page;
}

interface LabosAgentState {
  readonly isOpen: boolean;
  /** The page the agent reads. `null`: no page context. */
  readonly context: LabosAgentOpenContext | null;
  /**
   * The chats of this page visit, by `chatKey`. They outlive the panel, so closing and reopening from the same
   * context restores the chat. A full page load clears them (no saved history in v0).
   */
  readonly chats: Record<string, LabosAgentChat>;
  /**
   * The first message to put in the composer when the panel opens (S3: "Help me write an intro request to <name>.").
   * The member can change it before they send. The panel takes it once and clears it.
   */
  readonly prefill: string | null;
  readonly actions: {
    /**
     * The one "open with context" call (LAB-3298). Opens the panel on this context. S2–S5 reuse it.
     * The chat of that context comes back; a context with no chat starts a new one.
     */
    openAgent: (options?: { context?: LabosAgentOpenContext | null; prefill?: string }) => void;
    /** The panel calls this after it puts `prefill` in the composer. */
    clearPrefill: () => void;
    closeAgent: () => void;
    /** Changes the turns of one chat. Creates the chat (and its `threadId`) on first use. */
    updateTurns: (key: string, update: (turns: LabosAgentTurn[]) => LabosAgentTurn[]) => void;
    /** New chat: a new `threadId` and no turns. */
    resetChat: (key: string) => void;
  };
}

export const useLabosAgentStore = create<LabosAgentState>((set) => ({
  isOpen: false,
  context: null,
  chats: {},
  prefill: null,
  actions: {
    openAgent: ({ context = null, prefill } = {}) => set({ isOpen: true, context, prefill: prefill ?? null }),
    clearPrefill: () => set({ prefill: null }),
    closeAgent: () => set({ isOpen: false }),
    updateTurns: (key, update) =>
      set((state) => {
        const chat = state.chats[key] ?? { threadId: generateUUID(), turns: [] };
        return { chats: { ...state.chats, [key]: { ...chat, turns: update(chat.turns) } } };
      }),
    resetChat: (key) => set((state) => ({ chats: { ...state.chats, [key]: { threadId: generateUUID(), turns: [] } } })),
  },
}));

/** `const openAgent = useOpenAgent(); openAgent({ context })`. */
export const useOpenAgent = () => useLabosAgentStore((s) => s.actions.openAgent);
