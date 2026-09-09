import { getHuskyThreadById } from '@/services/husky.service';
import type { HuskyTurn } from './hooks/useHuskyChat';

export type AiSearchThreadResult =
  | { ok: true; threadId: string; title: string; turns: HuskyTurn[] }
  | { ok: false; status: number };

/**
 * A thread, in the shape the dialog's answer state actually renders.
 *
 * `getHuskyThreadById` returns an untagged union — `{isError, status}` on
 * failure, the thread otherwise — so both existing callers wrote
 * `analytics.track(thread.title)` *before* `if (!thread) return`, which is a
 * guard that can never fire. On a failure they sent an event with an undefined
 * title and then dropped the user into a blank answer.
 *
 * The `sql` field it maps from `sqlData` is not carried over: the backend's
 * response contract, its persistence call and its stored documents have never
 * contained that key, so it is always undefined.
 */
export async function getAiSearchThread(id: string, authToken: string): Promise<AiSearchThreadResult> {
  const thread = await getHuskyThreadById(id, authToken);

  if (!thread || 'isError' in thread) {
    return { ok: false, status: (thread as { status?: number })?.status ?? 0 };
  }

  const chats = Array.isArray(thread.chats) ? thread.chats : [];

  return {
    ok: true,
    threadId: thread.threadId,
    title: thread.title,
    turns: chats.map(
      (chat: { id?: string; question?: string; answer?: string; sources?: string[]; actions?: HuskyTurn['actions']; followUpQuestions?: string[] }): HuskyTurn => ({
        chatId: chat.id ?? `${thread.threadId}-${chat.question ?? ''}`,
        question: chat.question ?? '',
        answer: chat.answer ?? '',
        sources: chat.sources ?? [],
        actions: chat.actions ?? [],
        followUpQuestions: chat.followUpQuestions ?? [],
      }),
    ),
  };
}
