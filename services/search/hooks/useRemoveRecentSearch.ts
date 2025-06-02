import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';

type MutationParams = {
  item: string;
};

async function mutation({ item }: MutationParams) {
  try {
    const key = 'recentSearches';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = existing.filter((t: string) => t !== item);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove recent search', e);
  }
}

export function useRemoveRecentSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SearchQueryKeys.GET_RECENT_SEARCH],
      });
    },
  });
}
