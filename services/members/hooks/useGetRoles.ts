import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { useFilterStore } from '@/services/members/store';
import { Option } from '@/services/members/types';

async function fetcher(input: string, hasOfficeHours?: boolean) {
  const params = new URLSearchParams({
    q: input,
    limit: '50',
  });

  // Add hasOfficeHours parameter if it's set
  if (hasOfficeHours) {
    params.append('hasOfficeHours', 'true');
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
  const hasOfficeHours = params.get('hasOfficeHours') === 'true';

  return useQuery<Option[]>({
    queryKey: [MembersQueryKeys.GET_ROLES, input, hasOfficeHours],
    queryFn: () => fetcher(input, hasOfficeHours),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
