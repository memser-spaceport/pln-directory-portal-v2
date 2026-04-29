import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateJobAlert } from '@/services/job-alerts/job-alerts.service';
import { JobAlertsQueryKey } from '@/services/job-alerts/constants';
import type { IJobAlert, IJobAlertsListResponse, IUpdateJobAlertPayload } from '@/types/job-alerts.types';

export function useUpdateJobAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, payload }: { uid: string; payload: IUpdateJobAlertPayload }) =>
      updateJobAlert(uid, payload),
    onSuccess: async (updated: IJobAlert) => {
      queryClient.setQueryData<IJobAlertsListResponse>([JobAlertsQueryKey.List], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((a) => (a.uid === updated.uid ? updated : a)),
        };
      });
      await queryClient.invalidateQueries({ queryKey: [JobAlertsQueryKey.List] });
    },
  });
}
