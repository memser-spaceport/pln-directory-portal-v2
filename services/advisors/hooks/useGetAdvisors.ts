import { useQuery } from '@tanstack/react-query';
import { getAdvisors } from '../advisors.service';
import { AdvisorsQueryKeys } from '../constants';

export function useGetAdvisors() {
  return useQuery({
    queryKey: [AdvisorsQueryKeys.ADVISORS_LIST],
    queryFn: getAdvisors,
    staleTime: 5 * 60 * 1000,
  });
}
