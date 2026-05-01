import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJobAlert } from '@/services/job-alerts/job-alerts.service';
import { JobAlertsQueryKey } from '@/services/job-alerts/constants';
import type { ICreateJobAlertPayload } from '@/types/job-alerts.types';

export function useCreateJobAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ICreateJobAlertPayload) => createJobAlert(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [JobAlertsQueryKey.List] });
    },
  });
}
