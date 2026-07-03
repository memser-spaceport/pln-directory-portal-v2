import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/core/ToastContainer/utils/toast';
import { useAffinityAnalytics } from '@/analytics/affinity.analytics';
import { AffinityQueryKeys } from '@/services/affinity/constants';
import { AffinityRetriggerError, retriggerAffinityEnrichment } from '@/services/affinity/affinity.service';

function resolveRetriggerErrorType(error: unknown): string {
  if (error instanceof AffinityRetriggerError) {
    if (error.status === 409) return 'in_progress';
    return 'generic';
  }
  return 'generic';
}

export function useRetriggerAffinityEnrichment(memberUid: string) {
  const queryClient = useQueryClient();
  const { onRelationshipRefreshSucceeded, onRelationshipRefreshFailed } = useAffinityAnalytics();

  return useMutation({
    mutationFn: () => retriggerAffinityEnrichment(memberUid),
    onSuccess: async () => {
      onRelationshipRefreshSucceeded({ memberUid });
      await queryClient.invalidateQueries({ queryKey: [AffinityQueryKeys.GET_AFFINITY_MEMBER, memberUid] });
      toast.success('Relationship data refreshed');
    },
    onError: (error: unknown) => {
      onRelationshipRefreshFailed({ memberUid, errorType: resolveRetriggerErrorType(error) });
      if (error instanceof AffinityRetriggerError) {
        toast.error(error.userMessage ?? 'Something went wrong. Please try again.');
        return;
      }
      toast.error('Something went wrong. Please try again.');
    },
  });
}
