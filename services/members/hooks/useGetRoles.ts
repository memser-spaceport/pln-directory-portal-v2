import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { useFilterStore } from '@/services/members/store';
import { Option } from '@/services/members/types';
import { OFFICE_HOURS_FILTER_PARAM_KEY } from '@/app/constants/filters';

async function fetcher(input: string, useOfficeHours?: boolean) {
  const params = new URLSearchParams({
    q: input,
    limit: '50',
  });

  // Add hasOfficeHours parameter if it's set
  if (useOfficeHours) {
    params.append(OFFICE_HOURS_FILTER_PARAM_KEY, 'true');
  }

  const res = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/autocomplete/roles?${params.toString()}`,
    {},
    false,
  );

  if (!res?.ok) {
    throw new Error('Failed to fetch roles');
  }

  const data = await res.json();

  return data.results.map((item: any) => ({
    value: item.role,
    label: item.role,
    count: item.count,
  }));
}

export function useGetRoles(input: string) {
  const { params } = useFilterStore();
  const useOfficeHours = params.get(OFFICE_HOURS_FILTER_PARAM_KEY) === 'true';

  return useQuery<Option[]>({
    queryKey: [MembersQueryKeys.GET_ROLES, input, useOfficeHours],
    queryFn: () => fetcher(input, useOfficeHours),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
