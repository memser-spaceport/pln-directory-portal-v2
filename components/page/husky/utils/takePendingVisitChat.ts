import type { IVisitChat } from '../types/visitChat';

import { PENDING_VISIT_CHAT_KEY } from '../constants/visitChats';

import { getVisitChats } from './getVisitChats';
import { getSessionStorage } from './getSessionStorage';

export function takePendingVisitChat(): IVisitChat | null {
  const storage = getSessionStorage();
  const threadId = storage?.getItem(PENDING_VISIT_CHAT_KEY);
  if (!threadId) {
    return null;
  }
  storage?.removeItem(PENDING_VISIT_CHAT_KEY);
  return getVisitChats().find((chat) => chat.threadId === threadId) ?? null;
}
