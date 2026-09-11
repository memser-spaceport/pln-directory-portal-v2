import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';
import { RECENT_SEARCH_STORAGE_KEY } from '@/services/search/hooks/useRecentSearch';

type MutationParams = {
  item: string;
};

async function mutation({ item }: MutationParams) {
  try {
    const existing = JSON.parse(localStorage.getItem(RECENT_SEARCH_STORAGE_KEY) || '[]');
    const updated = existing.filter((t: string) => t !== item);
    localStorage.setItem(RECENT_SEARCH_STORAGE_KEY, JSON.stringify(updated));
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
