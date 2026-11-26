import { AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX } from '@/components/constants/aiSearchHandoff';

/**
 * LAB-3429: the questions the agent handed over to this thread, once. The key is removed when it is read. A missing,
 * blocked or broken entry gives an empty list.
 */
export function takePendingQuestions(threadId: string | undefined): string[] {
  if (!threadId) {
    return [];
  }
  try {
    const key = AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX + threadId;
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return [];
    }
    window.localStorage.removeItem(key);
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === 'string' && q.trim().length > 0) : [];
  } catch {
    return [];
  }
}
