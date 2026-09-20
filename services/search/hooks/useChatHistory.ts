import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { getHuskyHistory } from '@/services/husky.service';

export interface ChatHistoryThread {
  threadId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

async function fetcher(): Promise<ChatHistoryThread[]> {
  const { authToken } = getCookiesFromClient();

  if (!authToken) {
    return [];
  }

  const history = await getHuskyHistory(authToken);

  /* `getHuskyHistory` answers a failure with `{ isError, status }` — an object,
     not an array. Every consumer then reached for a list method on it: the old
     history view did `(chats ?? []).reduce(...)`, and an object is not nullish,
     so a 401 surfaced as `TypeError: chats.reduce is not a function` rather
     than as a failed request. Normalised here, once, and thrown so React Query
     can actually report it. */
  if (!Array.isArray(history)) {
    throw new Error(
      `Could not load AI Search history (status ${(history as { status?: number })?.status ?? 'unknown'})`,
    );
  }

  return history as ChatHistoryThread[];
}

export function useChatHistory({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [SearchQueryKeys.GET_AI_CHAT_HISTORY],
    queryFn: fetcher,
    /* Coerced even though the parameter is typed `boolean`: React Query v5
       validates this and *throws*, so a caller handing over a falsy non-boolean
       takes the whole tree down instead of just not fetching. That is exactly
       what the signed-out `isLoggedIn` — `''` — used to do here. */
    enabled: !!enabled,
  });
}
