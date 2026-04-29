import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteJobAlert } from '@/services/job-alerts/job-alerts.service';
import { JobAlertsQueryKey } from '@/services/job-alerts/constants';

export function useDeleteJobAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uid: string) => deleteJobAlert(uid),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [JobAlertsQueryKey.List] });
    },
  });
}
