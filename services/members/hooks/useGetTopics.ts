import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { useFilterStore } from '@/services/members/store';
import { keepPreviousData } from '@tanstack/react-query';
import { Option } from '@/services/members/types';
import { OFFICE_HOURS_FILTER_PARAM_KEY } from '@/app/constants/filters';

async function fetcher(input: string, useOfficeHours?: boolean) {
  const params = new URLSearchParams({
    q: input,
    limit: '10',
  });

  // Add hasOfficeHours parameter if it's set
  if (useOfficeHours) {
    params.append(OFFICE_HOURS_FILTER_PARAM_KEY, 'true');
  }

  const res = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/autocomplete/topics?${params.toString()}`,
    {},
    false,
  );

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
  const { params } = useFilterStore();
  const useOfficeHours = params.get(OFFICE_HOURS_FILTER_PARAM_KEY) === 'true';

  return useQuery<Option[]>({
    queryKey: [MembersQueryKeys.GET_TOPICS, input, useOfficeHours],
    queryFn: () => fetcher(input, useOfficeHours),
    staleTime: 1000 * 60 * 60, // 1 hour
    placeholderData: keepPreviousData,
  });
}
