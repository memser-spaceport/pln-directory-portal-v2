import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';

async function fetcher() {
  return [
    {
      id: '1',
      text: 'Filecoin storage solutions',
    },
    {
      id: '2',
      text: 'Zama privacy technology',
    },
    {
      id: '3',
      text: 'Celestia blockchain architecture',
    },
  ];
}

export function useRecentSearch() {
  return useQuery({
    queryKey: [SearchQueryKeys.GET_RECENT_SEARCH],
    queryFn: fetcher,
  });
}
