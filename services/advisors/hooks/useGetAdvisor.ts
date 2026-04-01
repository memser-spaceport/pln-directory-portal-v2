import { useQuery } from '@tanstack/react-query';
import { getAdvisorById, getBookableSlots } from '../advisors.service';
import { AdvisorsQueryKeys } from '../constants';

export function useGetAdvisor(id: string) {
  return useQuery({
    queryKey: [AdvisorsQueryKeys.ADVISOR_BY_ID, id],
    queryFn: async () => {
      const [advisor, bookableSlots] = await Promise.all([
        getAdvisorById(id),
        getBookableSlots(id),
      ]);
      return { advisor, bookableSlots };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
