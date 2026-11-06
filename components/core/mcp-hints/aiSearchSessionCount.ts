/**
 * How many questions the member has sent on AI Search in this browser session (LAB-3033). The search hint
 * starts from the second one. Storage can be blocked (private mode, sandboxed frames): then nothing counts.
 */
const KEY = 'mcp_hint_ai_search_count';

export function getAiSearchCount(): number {
  try {
    return Number(sessionStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export function countAiSearch(): void {
  try {
    sessionStorage.setItem(KEY, String(getAiSearchCount() + 1));
  } catch {
    // No storage: the search hint just never shows.
  }
}
