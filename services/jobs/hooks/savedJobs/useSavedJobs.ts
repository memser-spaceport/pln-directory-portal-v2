'use client';

import { useQuery } from '@tanstack/react-query';

import type { ISavedJob } from '@/types/jobs.types';
import { JobsQueryKey } from '@/services/jobs/constants';
import { fetchSavedJobs } from '@/services/jobs/saved-jobs.service';

import type { MemberScopedOptions } from './types/memberScopedOptions';

/** The whole saved list, so a jobUid absent from it means not saved. */
export function useSavedJobs({ memberUid, enabled }: MemberScopedOptions) {
  return useQuery<ISavedJob[]>({
    queryKey: [JobsQueryKey.SavedJobs],
    queryFn: fetchSavedJobs,
    enabled: enabled && !!memberUid,
    staleTime: Infinity,
  });
}
