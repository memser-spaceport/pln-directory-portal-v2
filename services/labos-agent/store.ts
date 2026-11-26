import { create } from 'zustand';

import type {
  LabosAgentChat,
  LabosAgentEntryPoint,
  LabosAgentOpenContext,
  LabosAgentSession,
  LabosAgentSurface,
  LabosAgentTurn,
} from '@/types/labos-agent.types';
import { generateUUID } from '@/utils/common.utils';

/** One key per context: one chat per story, one for Home, one for no context. */
export function chatKey(context: LabosAgentOpenContext | null): string {
  if (!context) return 'none';
  if (context.page === 'news-story') return `news-story:${context.newsUid}`;
  if (context.page === 'intro') return `intro:${context.introTarget.type}:${context.introTarget.uid}`;
  if (context.page === 'member') return `member:${context.memberUid}`;
  if (context.page === 'team') return `team:${context.teamUid}`;
  if (context.page === 'job') return context.jobUid ? `job:${context.jobUid}` : 'job';
  return context.page;
}

interface LabosAgentState {
  readonly isOpen: boolean;
  /** The page the agent reads. `null`: no page context. */
  readonly context: LabosAgentOpenContext | null;
  /**
   * S5 (LAB-3302): `false` after the member removes the page chip. Then C1 sends no `context`. Each `openAgent` sets it
   * back to `true`, except for a chat with `pageUnreadable` (a page 404, S5-C29): that chat opens with the chip off.
   */
  readonly readsPage: boolean;
  /**
   * LAB-3429: the panel opened on a page the agent can't read (`isUnreadablePage`: settings, notifications). The chip
   * says "Can't read this page". The context is `null` there, so the agent reads no page.
   */
  readonly pageLocked: boolean;
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
  /**
   * The intro targets that got a C3 send from a draft card in this page visit, by `introRequestTargetKey` (S3). C3 has
   * no duplicate check, so a later draft card for the same target shows "Intro already requested" and no Send.
   */
  readonly sentIntroTargets: Record<string, true>;
  /**
   * LAB-3297: the dock session of the agent events. It stays after the close, so a stream that ends after the close
   * still sends its events with the right `conversationId`. `null` before the first open.
   */
  readonly session: LabosAgentSession | null;
  /**
   * LAB-3457: the session of the chat open on the AI agent chat page, for the agent events with `surface: 'page'`.
   * Each new or opened page chat starts one. `null` before the page shows the agent.
   */
  readonly pageSession: LabosAgentSession | null;
  readonly actions: {
    /**
     * The one "open with context" call (LAB-3298). Opens the panel on this context. S2–S5 reuse it.
     * The chat of that context comes back; a context with no chat starts a new one.
     */
    openAgent: (options?: {
      context?: LabosAgentOpenContext | null;
      prefill?: string;
      /** LAB-3297: for the agent events. Default `corner`. */
      entryPoint?: LabosAgentEntryPoint;
      /** LAB-3429: the page under the panel is one the agent can't read. Default `false`. */
      pageLocked?: boolean;
    }) => void;
    /** LAB-3297: adds to a count of the current session of a surface (default: the dock session). */
    countSession: (
      field: 'turnCount' | 'actionCount' | 'confirmedCount',
      by?: number,
      surface?: LabosAgentSurface,
    ) => void;
    /** LAB-3457: a new page chat on AI agent chat starts a new page session (a new `conversationId`). */
    startPageSession: (context?: LabosAgentOpenContext | null) => void;
    /**
     * LAB-3457: the page's chat, by its own key and thread id. Creates the chat with these turns when the key has none;
     * an existing chat stays as it is.
     */
    ensureChat: (key: string, threadId: string, turns?: LabosAgentTurn[]) => void;
    /** The chip ✕ (`false`) and "Read this page" (`true`), LAB-3302. */
    setReadsPage: (readsPage: boolean) => void;
    /** The panel calls this after it puts `prefill` in the composer. */
    clearPrefill: () => void;
    markIntroTargetSent: (key: string) => void;
    closeAgent: () => void;
    /** S5-C29: C1 cannot read the page of this chat. A new open of the chat starts with the chip off. */
    markPageUnreadable: (key: string) => void;
    /** Changes the turns of one chat. Creates the chat (and its `threadId`) on first use. */
    updateTurns: (key: string, update: (turns: LabosAgentTurn[]) => LabosAgentTurn[]) => void;
    /** New chat: a new `threadId` and no turns. */
    resetChat: (key: string) => void;
    /**
     * LAB-3457: C1 said `THREAD_NOT_FOUND` (the thread was deleted, or is not the member's). The chat keeps its turns
     * and gets a new `threadId`, which comes back.
     */
    renewThread: (key: string) => string;
  };
}

export const useLabosAgentStore = create<LabosAgentState>((set, get) => ({
  isOpen: false,
  context: null,
  readsPage: true,
  pageLocked: false,
  chats: {},
  prefill: null,
  sentIntroTargets: {},
  session: null,
  pageSession: null,
  actions: {
    openAgent: ({ context = null, prefill, entryPoint = 'corner', pageLocked = false } = {}) =>
      set((state) => {
        const readsPage = !state.chats[chatKey(context)]?.pageUnreadable;
        // LAB-3297: a closed panel, or a new context in the open panel, starts a new dock session.
        const sameSession = state.isOpen && state.session && chatKey(state.context) === chatKey(context);
        return {
          isOpen: true,
          context,
          readsPage,
          pageLocked: !context && pageLocked,
          prefill: prefill ?? null,
          session: sameSession
            ? state.session
            : {
                conversationId: generateUUID(),
                entryPoint,
                context,
                contextAttached: !!context && readsPage,
                openedAt: Date.now(),
                turnCount: 0,
                actionCount: 0,
                confirmedCount: 0,
              },
        };
      }),
    countSession: (field, by = 1, surface = 'panel') =>
      set((state) => {
        const slot = surface === 'page' ? 'pageSession' : 'session';
        const current = state[slot];
        return current ? { [slot]: { ...current, [field]: current[field] + by } } : {};
      }),
    startPageSession: (context = null) =>
      set({
        pageSession: {
          conversationId: generateUUID(),
          entryPoint: 'ai-search-page',
          context,
          contextAttached: !!context,
          openedAt: Date.now(),
          turnCount: 0,
          actionCount: 0,
          confirmedCount: 0,
        },
      }),
    ensureChat: (key, threadId, turns = []) =>
      set((state) => (state.chats[key] ? {} : { chats: { ...state.chats, [key]: { threadId, turns } } })),
    setReadsPage: (readsPage) => set({ readsPage }),
    clearPrefill: () => set({ prefill: null }),
    markIntroTargetSent: (key) => set((state) => ({ sentIntroTargets: { ...state.sentIntroTargets, [key]: true } })),
    closeAgent: () => set({ isOpen: false }),
    markPageUnreadable: (key) =>
      set((state) => {
        const chat = state.chats[key] ?? { threadId: generateUUID(), turns: [] };
        return { chats: { ...state.chats, [key]: { ...chat, pageUnreadable: true } } };
      }),
    updateTurns: (key, update) =>
      set((state) => {
        const chat = state.chats[key] ?? { threadId: generateUUID(), turns: [] };
        return { chats: { ...state.chats, [key]: { ...chat, turns: update(chat.turns) } } };
      }),
    resetChat: (key) => set((state) => ({ chats: { ...state.chats, [key]: { threadId: generateUUID(), turns: [] } } })),
    renewThread: (key) => {
      const threadId = generateUUID();
      const chat = get().chats[key] ?? { turns: [] };
      set((state) => ({ chats: { ...state.chats, [key]: { ...chat, threadId } } }));
      return threadId;
    },
  },
}));

/** `const openAgent = useOpenAgent(); openAgent({ context })`. */
export const useOpenAgent = () => useLabosAgentStore((s) => s.actions.openAgent);
