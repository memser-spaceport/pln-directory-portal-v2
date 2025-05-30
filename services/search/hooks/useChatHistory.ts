import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { getHuskyHistory } from '@/services/husky.service';

async function fetcher() {
  const { authToken } = getCookiesFromClient();

  if (!authToken) {
    return null;
  }

  return getHuskyHistory(authToken);
}

export function useChatHistory() {
  return useQuery({
    queryKey: [SearchQueryKeys.GET_AI_CHAT_HISTORY],
    queryFn: fetcher,
  });
}
