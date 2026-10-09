import type { useRouter } from 'next/navigation';

import { PAGE_ROUTES } from '@/utils/constants';

import type { IAiSearchReturn } from '../types/aiSearchReturn';

import { AI_SEARCH_RETURN_KEY, AI_SEARCH_HISTORY_PARAM, HEADER_SEARCH_OPEN_PARAM } from '../constants/aiSearchHandoff';

interface Input {
  router: ReturnType<typeof useRouter>;
  term: string;
  question?: string;
  threadId?: string;
  showHistory?: boolean;
}

function currentPathWithoutSearchState() {
  const params = new URLSearchParams(window.location.search);
  params.delete(HEADER_SEARCH_OPEN_PARAM);
  const query = params.toString();
  return query ? `${window.location.pathname}?${query}` : window.location.pathname;
}

// "Back to search" returns here. Searching again from the AI Search page keeps the page the member came from.
function rememberReturn(term: string) {
  const here = currentPathWithoutSearchState();
  let path = here;
  if (here.startsWith(PAGE_ROUTES.HUSKY)) {
    const saved = sessionStorage.getItem(AI_SEARCH_RETURN_KEY);
    path = saved ? (JSON.parse(saved) as IAiSearchReturn).path : PAGE_ROUTES.HOME;
  }
  const entry: IAiSearchReturn = { path, term };
  sessionStorage.setItem(AI_SEARCH_RETURN_KEY, JSON.stringify(entry));
}

export function openAiSearch(input: Input) {
  const { router, term, question, threadId, showHistory } = input;

  rememberReturn(term);
  if (question) {
    // The chat on /ai-search asks a question left here when it mounts.
    localStorage.setItem('input', question);
  }

  const path = threadId ? `${PAGE_ROUTES.HUSKY}/${threadId}` : PAGE_ROUTES.HUSKY;
  router.push(showHistory ? `${path}?${AI_SEARCH_HISTORY_PARAM}=open` : path);
  if (!threadId) {
    // Already on /ai-search, the open chat makes way for a new one.
    document.dispatchEvent(new CustomEvent('new-chat'));
  }
}
