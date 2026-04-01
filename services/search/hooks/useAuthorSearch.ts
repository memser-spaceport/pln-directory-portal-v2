import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';
import { SearchResult } from '@/services/search/types';
import { getCookiesFromClient } from '@/utils/third-party.helper';

async function fetchAuthorSearch(searchTerm: string): Promise<SearchResult | undefined> {
  const { authToken } = getCookiesFromClient();
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/global-search/all?q=${searchTerm}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (response?.ok) {
    return response.json();
  }
}

export function useAuthorSearch(searchTerm: string) {
  return useQuery({
    queryKey: [SearchQueryKeys.AUTHOR_SEARCH, searchTerm],
    queryFn: () => fetchAuthorSearch(searchTerm),
    enabled: searchTerm.length >= 2,
  });
}
