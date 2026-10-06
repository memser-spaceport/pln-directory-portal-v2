/**
 * Chats a signed-out visitor starts on AI Search, kept for this visit only.
 *
 * Signed-out chats are not saved on the server, so the History rail lists them
 * from the browser's per-tab storage (cleared when the tab closes). Every read
 * and write is guarded: storage can be blocked, full or absent.
 */

export interface IVisitChat {
  threadId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: any[];
}

export const VISIT_CHATS_STORAGE_KEY = 'ai-search-visit-chats';
export const PENDING_VISIT_CHAT_KEY = 'ai-search-open-visit-chat';
export const OPEN_VISIT_CHAT_EVENT = 'open-visit-chat';

const storage = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
};

/** This visit's chats, newest first. */
export const getVisitChats = (): IVisitChat[] => {
  try {
    const raw = storage()?.getItem(VISIT_CHATS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((chat) => chat && typeof chat.threadId === 'string')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
};

const writeVisitChats = (chats: IVisitChat[]) => {
  try {
    storage()?.setItem(VISIT_CHATS_STORAGE_KEY, JSON.stringify(chats));
  } catch {
    // Storage is full or blocked: the rail shows what it has.
  }
};

export const getVisitChat = (threadId: string): IVisitChat | null =>
  getVisitChats().find((chat) => chat.threadId === threadId) ?? null;

/** Adds the chat, or replaces its messages if it is already listed. */
export const saveVisitChat = ({ threadId, messages }: { threadId: string; messages: any[] }) => {
  if (!threadId || !messages?.length) return;
  const now = new Date().toISOString();
  const chats = getVisitChats();
  const existing = chats.find((chat) => chat.threadId === threadId);
  // reopening a chat without asking anything must not move it to the top
  if (existing && JSON.stringify(existing.messages) === JSON.stringify(messages)) return;
  const title = existing?.title || String(messages[0]?.question ?? '').trim() || 'New chat';
  const next: IVisitChat = {
    threadId,
    title,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    messages,
  };
  writeVisitChats([next, ...chats.filter((chat) => chat.threadId !== threadId)]);
};

export const removeVisitChat = (threadId: string) => {
  writeVisitChats(getVisitChats().filter((chat) => chat.threadId !== threadId));
};

/** Marks a chat for the /ai-search page to open when it mounts (it may not be mounted yet). */
export const setPendingVisitChat = (threadId: string) => {
  try {
    storage()?.setItem(PENDING_VISIT_CHAT_KEY, threadId);
  } catch {
    // ignore
  }
};

/** Returns the chat marked by setPendingVisitChat once, then clears the mark. */
export const takePendingVisitChat = (): IVisitChat | null => {
  try {
    const threadId = storage()?.getItem(PENDING_VISIT_CHAT_KEY);
    if (!threadId) return null;
    storage()?.removeItem(PENDING_VISIT_CHAT_KEY);
    return getVisitChat(threadId);
  } catch {
    return null;
  }
};
