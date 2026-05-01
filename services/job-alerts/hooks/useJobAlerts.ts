import { useQuery } from '@tanstack/react-query';
import { listJobAlerts } from '@/services/job-alerts/job-alerts.service';
import { JobAlertsQueryKey } from '@/services/job-alerts/constants';

export function useJobAlerts(enabled = true) {
  return useQuery({
    queryKey: [JobAlertsQueryKey.List],
    queryFn: () => listJobAlerts(),
    enabled,
    staleTime: 30_000,
  });
}
