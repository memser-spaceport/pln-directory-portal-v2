'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ISavedJob } from '@/types/jobs.types';
import { JobsQueryKey } from '@/services/jobs/constants';
import { saveJob, unsaveJob } from '@/services/jobs/saved-jobs.service';
import { toast } from '@/components/core/ToastContainer';

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

      queryClient.setQueryData<ISavedJob[]>(key, (current = []) => {
        if (saved) {
          return current.filter((savedJob) => savedJob.jobUid !== roleUid);
        }
        /* Neither endpoint answers with a stamp, and only the server can mint a
           `uid` — this row is replaced when the list is next read. */
        return [{ uid: `pending-${roleUid}`, jobUid: roleUid, savedAt: new Date().toISOString() }, ...current];
      });

      return { previous };
    },
    /* The Saved tab is a server-side narrowing, so the saved map changing does
       not change the list held for that scope — at `staleTime: 30_000` its rows
       and its count would disagree. Only the scoped entries: a bookmark leaves
       the whole board untouched. */
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [name, params] = query.queryKey as [JobsQueryKey, string | undefined];
          const isBoardQuery = name === JobsQueryKey.List || name === JobsQueryKey.Filters;
          return isBoardQuery && new URLSearchParams(params).get('saved') === 'true';
        },
      });
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
