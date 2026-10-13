import { PENDING_VISIT_CHAT_KEY } from '../constants/visitChats';

import { getSessionStorage } from './getSessionStorage';

// The /ai-search page may not be mounted yet when the rail picks a chat; it opens the chat on mount.
export function setPendingVisitChat(threadId: string) {
  getSessionStorage()?.setItem(PENDING_VISIT_CHAT_KEY, threadId);
}
