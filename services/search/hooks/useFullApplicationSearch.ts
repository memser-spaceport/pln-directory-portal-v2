import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';
import { SearchResult } from '@/services/search/types';
import { getCookiesFromClient } from '@/utils/third-party.helper';
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

  /* A non-ok response used to fall out of here as `undefined`, which React
     Query records as a *success with no data* — so a 500 rendered as
     "No results for ..." and nothing anywhere said the search had failed. */
  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }

  return (await response.json()) as SearchResult;
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
