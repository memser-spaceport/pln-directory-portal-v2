import { getVisitChats } from './getVisitChats';
import { writeVisitChats } from './writeVisitChats';

export function removeVisitChat(threadId: string) {
  writeVisitChats(getVisitChats().filter((chat) => chat.threadId !== threadId));
}
