import { create } from 'zustand';

import type { LabosAgentOpenContext } from '@/types/labos-agent.types';

interface LabosAgentState {
  readonly isOpen: boolean;
  /** The page the agent reads. `null`: no page context. */
  readonly context: LabosAgentOpenContext | null;
  /** Goes up on each `openAgent` with a new context, so the panel starts a new chat. */
  readonly session: number;
  readonly actions: {
    /**
     * The one "open with context" call (LAB-3298). Opens the panel on this context. S2–S5 reuse it.
     * The same context as the open chat keeps the chat; another context starts a new chat.
     */
    openAgent: (options?: { context?: LabosAgentOpenContext | null }) => void;
    closeAgent: () => void;
  };
}

const sameContext = (a: LabosAgentOpenContext | null, b: LabosAgentOpenContext | null) => {
  if (a === b) return true;
  if (!a || !b || a.page !== b.page) return false;
  if (a.page === 'news-story' && b.page === 'news-story') return a.newsUid === b.newsUid;
  return true;
};

export const useLabosAgentStore = create<LabosAgentState>((set, get) => ({
  isOpen: false,
  context: null,
  session: 0,
  actions: {
    openAgent: ({ context = null } = {}) => {
      const { context: current, session } = get();
      set({
        isOpen: true,
        context,
        session: sameContext(current, context) && session > 0 ? session : session + 1,
      });
    },
    closeAgent: () => set({ isOpen: false }),
  },
}));

/** `const openAgent = useOpenAgent(); openAgent({ context })`. */
export const useOpenAgent = () => useLabosAgentStore((s) => s.actions.openAgent);
