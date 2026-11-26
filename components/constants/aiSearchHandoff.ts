export const AI_SEARCH_RETURN_KEY = 'ai-search-return';
export const REOPEN_HEADER_SEARCH_EVENT = 'reopen-header-search';
export const AI_SEARCH_HISTORY_PARAM = 'history';
export const HEADER_SEARCH_OPEN_PARAM = 'searchState';
/**
 * LAB-3429: localStorage, `<prefix><threadId>`: the questions the agent hands over to a new thread (a JSON array of
 * strings). The new tab reads it once and removes it, then asks the questions one at a time. localStorage, not
 * sessionStorage: a tab opened with no opener gets no copy of the opener's sessionStorage.
 */
export const AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX = 'ai-search-pending-questions:';
