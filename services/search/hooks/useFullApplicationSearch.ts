import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';
import { SearchResult } from '@/services/search/types';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { saveRecentSearch } from '@/services/search/hooks/useRecentSearch';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';

async function fetcher(searchTerm: string) {
  const { authToken } = getCookiesFromClient();
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/global-search/all?q=${searchTerm}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (response?.ok) {
    const result: SearchResult = await response.json();
    saveRecentSearch(searchTerm);

    return result;
  }
}

export function useFullApplicationSearch(searchTerm: string) {
  const analytics = useUnifiedSearchAnalytics();

  return useQuery({
    queryKey: [SearchQueryKeys.GET_FULL_APPLICATION_SEARCH_RESULTS, searchTerm],
    queryFn: () => {
      analytics.onFullSearch(searchTerm);

      return fetcher(searchTerm);
    },
    enabled: Boolean(searchTerm),
  });
}
