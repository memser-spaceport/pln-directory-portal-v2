import { useQuery } from '@tanstack/react-query';

import { TeamNewsQueryKeys } from '@/services/team-news/constants';
import { getNewsTags } from '@/services/team-news/team-news.service';

/** The tags members can choose on News preferences (LAB-3000). The backend caches the list for ten minutes too. */
export function useNewsTags() {
  return useQuery({
    queryKey: [TeamNewsQueryKeys.TAGS],
    queryFn: getNewsTags,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
