import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';
import type { IArticleAuthorSearchResponse } from '@/types/articles.types';
import { customFetch } from '@/utils/fetch-wrapper';

async function fetchArticleAuthorSearch(trimmed: string): Promise<IArticleAuthorSearchResponse> {
  if (!trimmed) {
    return { members: [], teams: [] };
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/articles/author-search?search=${encodeURIComponent(trimmed)}`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    return { members: [], teams: [] };
  }

  return response.json();
}

export function useAuthorSearch(searchTerm: string) {
  const trimmed = searchTerm.trim();

  return useQuery({
    queryKey: [SearchQueryKeys.AUTHOR_SEARCH, trimmed],
    queryFn: () => fetchArticleAuthorSearch(trimmed),
    enabled: trimmed.length >= 2,
  });
}
