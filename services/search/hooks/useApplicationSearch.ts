import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';

async function fetcher(searchTerm: string) {
  // const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams/${teamId}`, { cache: 'no-store' });

  // if (response?.ok) {
  //   const result = await response.json();
  //
  //   return result.asks as ITeamAsk[];
  // }

  return {
    events: [
      {
        id: 'event id here',
        name: 'event name here',
        matches: [
          {
            type: 'Tags',
            content: 'tag1, tag2, tag3',
          },
          {
            type: 'Description',
            content: 'Loren ipsum bal bala bala...',
          },
          {
            type: 'Locations',
            content: 'San Francisco, Spain',
          },
        ],
      },
    ],
    teams: [
      {
        id: 'team id here',
        name: 'team name here',
        matches: [
          {
            type: 'Tags',
            content: 'tag1, tag2, tag3',
          },
          {
            type: 'Description',
            content: 'Loren ipsum bal bala bala...',
          },
        ],
      },
    ],
  };
}

export function useApplicationSearch(searchTerm: string) {
  return useQuery({
    queryKey: [SearchQueryKeys.GET_APPLICATION_SEARCH_RESULTS, searchTerm],
    queryFn: () => fetcher(searchTerm),
    enabled: Boolean(searchTerm),
  });
}
