import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { useFilterStore } from '@/services/members/store';
import { Option } from '@/services/members/types';
import { OFFICE_HOURS_FILTER_PARAM_KEY } from '@/app/constants/filters';

async function fetcher(useOfficeHours?: boolean) {
  const params = new URLSearchParams();

  // Add hasOfficeHours parameter if it's set
  if (useOfficeHours) {
    params.append(OFFICE_HOURS_FILTER_PARAM_KEY, 'true');
  }

  const queryString = params.toString();
  const url = `${process.env.DIRECTORY_API_URL}/v1/members/autocomplete/investor-types${queryString ? `?${queryString}` : ''}`;

  const res = await customFetch(url, {}, false);

  if (!res?.ok) {
    throw new Error('Failed to fetch investor types');
  }

  const data = await res.json();

  // Backend returns counts that match frontend filter queries:
  // ANGEL count = members matching investorType=ANGEL|ANGEL_AND_FUND
  // FUND count = members matching investorType=FUND|ANGEL_AND_FUND
  return data.results.map((item: any) => ({
    value: item.type,
    label: item.label,
    count: item.count,
  }));
}

/**
 * Hook to get investor types with counts
 * @param _input - Unused parameter for interface compatibility with GenericCheckboxList
 * @returns Query result with investor type options
 */
export function useGetInvestorTypes(_input?: string) {
  const { params } = useFilterStore();
  const useOfficeHours = params.get(OFFICE_HOURS_FILTER_PARAM_KEY) === 'true';

  return useQuery<Option[]>({
    queryKey: [MembersQueryKeys.GET_INVESTOR_TYPES, useOfficeHours],
    queryFn: () => fetcher(useOfficeHours),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
