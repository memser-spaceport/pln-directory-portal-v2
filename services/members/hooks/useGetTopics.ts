import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';

async function fetcher(input: string) {
  const res = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/members/autocomplete/topics?q=${input}`, {}, false);

  if (!res?.ok) {
    throw new Error('Failed to fetch topics');
  }

  const data = await res.json();

  return data.results.map((item: any) => ({
    value: item.topic,
    label: item.topic,
    count: item.count,
  }));
}

export function useGetTopics(input: string) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_TOPICS, input],
    queryFn: () => fetcher(input),
    enabled: !!input,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
