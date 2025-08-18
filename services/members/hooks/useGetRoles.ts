import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';

async function fetcher(input: string) {
  const res = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/members/roles?searchText=${input}`, {}, false);

  if (!res?.ok) {
    throw new Error('Failed to fetch roles');
  }

  const data = await res.json();

  return data.map((item: any) => ({
    value: item.role,
    label: item.role,
    count: item.count,
  }));
}

export function useGetRoles(input: string) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_ROLES, input],
    queryFn: () => fetcher(input),
    enabled: !!input,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
