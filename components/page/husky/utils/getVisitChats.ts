import type { IVisitChat } from '../types/visitChat';

import { VISIT_CHATS_STORAGE_KEY } from '../constants/visitChats';

import { getSessionStorage } from './getSessionStorage';

export function getVisitChats(): IVisitChat[] {
  try {
    const raw = getSessionStorage()?.getItem(VISIT_CHATS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((chat) => chat && typeof chat.threadId === 'string')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}
