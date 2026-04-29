import { useMemo } from 'react';
import type { IJobAlert, IJobAlertFilterState } from '@/types/job-alerts.types';
import { filterStateToHashKey } from '@/utils/job-alerts.utils';
import { useJobAlerts } from './useJobAlerts';

interface JobAlertMatch {
  userAlert: IJobAlert | null;
  filtersMatchAlert: boolean;
}

export function useJobAlertMatch(filterState: IJobAlertFilterState, isLoggedIn: boolean): JobAlertMatch {
  const { data } = useJobAlerts(isLoggedIn);
  const userAlert = data?.items?.[0] ?? null;
  return useMemo(() => {
    if (!userAlert) return { userAlert: null, filtersMatchAlert: false };
    const filtersMatchAlert = filterStateToHashKey(userAlert.filterState) === filterStateToHashKey(filterState);
    return { userAlert, filtersMatchAlert };
  }, [userAlert, filterState]);
}
