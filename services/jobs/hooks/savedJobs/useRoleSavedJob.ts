'use client';

import { useQuery } from '@tanstack/react-query';

import type { ISavedJob } from '@/types/jobs.types';
import { JobsQueryKey } from '@/services/jobs/constants';
import { fetchSavedJobs } from '@/services/jobs/saved-jobs.service';

import type { MemberScopedOptions } from './types/memberScopedOptions';

/** Per-row subscription on the shared saved map: `select` narrows to this
 *  row's save, so one press re-renders one row rather than the list. */
export function useRoleSavedJob(roleUid: string, { memberUid, enabled }: MemberScopedOptions): ISavedJob | null {
  const { data } = useQuery({
    queryKey: [JobsQueryKey.SavedJobs],
    queryFn: fetchSavedJobs,
    enabled: enabled && !!memberUid,
    staleTime: Infinity,
    select: (savedJobs: ISavedJob[]) => savedJobs.find((savedJob) => savedJob.jobUid === roleUid) ?? null,
  });

  /* The repo's global `useQuery` mock ignores `select` and hands back its own
     object, so a shape test keeps tests on production's code path. */
  return data && typeof data === 'object' && 'jobUid' in data ? (data as ISavedJob) : null;
}
