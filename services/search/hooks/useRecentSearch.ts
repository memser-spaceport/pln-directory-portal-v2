import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';

export function saveRecentSearch(term: string) {
  try {
    const key = 'recentSearches';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [term, ...existing.filter((t: string) => t !== term)].slice(0, 3);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('recent-search-updated'));
  } catch (e) {
    console.error('Failed to save recent search', e);
  }
}

async function fetcher() {
  try {
    const key = 'recentSearches';
    return JSON.parse(localStorage.getItem(key) || '[]') as string[];
  } catch (e) {
    console.error('Failed to get recent search', e);
  }
}

export function useRecentSearch() {
  return useQuery({
    queryKey: [SearchQueryKeys.GET_RECENT_SEARCH],
    queryFn: fetcher,
  });
}
