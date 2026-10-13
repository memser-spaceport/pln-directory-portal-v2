'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ISavedJob } from '@/types/jobs.types';
import { JobsQueryKey } from '@/services/jobs/constants';
import { saveJob, unsaveJob } from '@/services/jobs/saved-jobs.service';
import { toast } from '@/components/core/ToastContainer';

import { isSavedScopeBoardQuery } from './utils/isSavedScopeBoardQuery';
import { toggleSavedJobInCache } from './utils/toggleSavedJobInCache';

export function useToggleSavedJob() {
  const queryClient = useQueryClient();
  const key = [JobsQueryKey.SavedJobs];

  return useMutation<void, Error, { roleUid: string; saved: boolean }, { previous?: ISavedJob[] }>({
    mutationFn: async ({ roleUid, saved }) => {
      if (saved) {
        await unsaveJob(roleUid);
      } else {
        await saveJob(roleUid);
      }
    },
    onMutate: async ({ roleUid, saved }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ISavedJob[]>(key);

      queryClient.setQueryData<ISavedJob[]>(key, (current = []) => toggleSavedJobInCache(current, roleUid, saved));

      return { previous };
    },
    /* The Saved tab is a server-side narrowing, so the saved map changing does
       not change the list held for that scope — at `staleTime: 30_000` its rows
       and its count would disagree. */
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => isSavedScopeBoardQuery(query.queryKey) });
    },
    onError: (_error, { saved }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error(
        saved ? 'Could not remove this role. Please try again.' : 'Could not save this role. Please try again.',
      );
    },
  });
}
