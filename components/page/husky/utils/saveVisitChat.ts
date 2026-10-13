import type { IVisitChat } from '../types/visitChat';

import { getVisitChats } from './getVisitChats';
import { writeVisitChats } from './writeVisitChats';

interface Input {
  threadId: string;
  messages: any[];
}

// Returns true when it wrote, so the caller refreshes the rail only on a change.
export function saveVisitChat(input: Input): boolean {
  const { threadId, messages } = input;

  const chats = getVisitChats();
  const existing = chats.find((chat) => chat.threadId === threadId);
  // Reopening a chat without asking anything must not move it to the top.
  if (existing && JSON.stringify(existing.messages) === JSON.stringify(messages)) {
    return false;
  }

  const now = new Date().toISOString();
  const chat: IVisitChat = {
    threadId,
    title: existing?.title || String(messages[0]?.question ?? '').trim() || 'New chat',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    messages,
  };
  writeVisitChats([chat, ...chats.filter((item) => item.threadId !== threadId)]);
  return true;
}
