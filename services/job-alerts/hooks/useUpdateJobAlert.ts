import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateJobAlert } from '@/services/job-alerts/job-alerts.service';
import { JobAlertsQueryKey } from '@/services/job-alerts/constants';
import type { IJobAlert, IJobAlertsListResponse, IUpdateJobAlertPayload } from '@/types/job-alerts.types';

export function useUpdateJobAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, payload }: { uid: string; payload: IUpdateJobAlertPayload }) =>
      updateJobAlert(uid, payload),
    onSuccess: (updated: IJobAlert) => {
      // Trust the mutation response: write it directly into the cache.
      // Don't invalidate — that would trigger a refetch that could race with the
      // optimistic update if the server is slow to reflect the change.
      queryClient.setQueryData<IJobAlertsListResponse>([JobAlertsQueryKey.List], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((a) => (a.uid === updated.uid ? updated : a)),
        };
      });
    },
  });
}
