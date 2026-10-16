import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';
import { SearchResult } from '@/services/search/types';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';

/** Same rule as the API's email lookup: the trimmed text has an "@" and at least 3 characters. */
export function isEmailQuery(searchTerm: string): boolean {
  const trimmed = (searchTerm ?? '').trim();
  return trimmed.length >= 3 && trimmed.includes('@');
}

/** `q` is URL-encoded, so "+" in an email address is not read as a space. */
export function getFullSearchUrl(searchTerm: string): string {
  return `${process.env.DIRECTORY_API_URL}/v1/global-search/all?q=${encodeURIComponent(searchTerm)}`;
}

async function fetcher(searchTerm: string) {
  const { authToken } = getCookiesFromClient();
  const response = await fetch(getFullSearchUrl(searchTerm), {
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

let lastEmailQueryTracked: string | null = null;

export function useFullApplicationSearch(searchTerm: string) {
  const analytics = useUnifiedSearchAnalytics();

  return useQuery({
    queryKey: [SearchQueryKeys.GET_FULL_APPLICATION_SEARCH_RESULTS, searchTerm],
    queryFn: () => {
      analytics.onFullSearch(searchTerm);
      // queryFn also runs on retries and refetches; send the email event once per search term.
      if (isEmailQuery(searchTerm) && lastEmailQueryTracked !== searchTerm) {
        lastEmailQueryTracked = searchTerm;
        analytics.onEmailQuerySubmitted();
      }

      return fetcher(searchTerm);
    },
    enabled: Boolean(searchTerm),
  });
}
