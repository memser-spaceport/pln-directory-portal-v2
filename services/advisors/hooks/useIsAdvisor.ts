import { useQuery } from '@tanstack/react-query';
import { checkIsAdvisor } from '../advisors.service';
import { AdvisorsQueryKeys } from '../constants';

export function useIsAdvisor(memberId: string | undefined) {
  return useQuery({
    queryKey: [AdvisorsQueryKeys.IS_ADVISOR, memberId],
    queryFn: () => checkIsAdvisor(memberId!),
    enabled: !!memberId,
    staleTime: 10 * 60 * 1000,
  });
}
