import { AI_SEARCH_HISTORY_PARAM } from '@/components/constants/aiSearchHandoff';
import { PAGE_ROUTES } from '@/utils/constants';

/**
 * LAB-3457: "AI agent chat" in the agent header opens the SAME chat on the full page, `/ai-search/<threadId>`. Every
 * finished turn is saved in the chat's thread (C1 `persist`), so nothing is copied and no question is asked again
 * (this replaces the LAB-3429 hand-off, which copied the questions into a new AI search thread).
 */

/** `/ai-search?history=open`: AI agent chat with its History rail open (LAB-3429 Decision 2). */
export const AI_SEARCH_HISTORY_URL = `${PAGE_ROUTES.HUSKY}?${AI_SEARCH_HISTORY_PARAM}=open`;

/** The full page of a saved chat. */
export const fullPageUrl = (threadId: string) => `${PAGE_ROUTES.HUSKY}/${encodeURIComponent(threadId)}`;
