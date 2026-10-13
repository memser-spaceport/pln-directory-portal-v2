import type { IVisitChat } from '../types/visitChat';

import { VISIT_CHATS_STORAGE_KEY } from '../constants/visitChats';

import { getSessionStorage } from './getSessionStorage';

export function writeVisitChats(chats: IVisitChat[]) {
  try {
    getSessionStorage()?.setItem(VISIT_CHATS_STORAGE_KEY, JSON.stringify(chats));
  } catch {
    // Storage is full: the rail keeps showing what is already stored.
  }
}
