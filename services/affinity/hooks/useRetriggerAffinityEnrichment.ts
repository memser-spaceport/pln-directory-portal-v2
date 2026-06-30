import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/core/ToastContainer/utils/toast';
import { AffinityQueryKeys } from '@/services/affinity/constants';
import { AffinityRetriggerError, retriggerAffinityEnrichment } from '@/services/affinity/affinity.service';

export function useRetriggerAffinityEnrichment(memberUid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => retriggerAffinityEnrichment(memberUid),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [AffinityQueryKeys.GET_AFFINITY_MEMBER, memberUid] });
      toast.success('Relationship data refreshed');
    },
    onError: (error: unknown) => {
      if (error instanceof AffinityRetriggerError) {
        toast.error(error.userMessage ?? 'Something went wrong. Please try again.');
        return;
      }
      toast.error('Something went wrong. Please try again.');
    },
  });
}
