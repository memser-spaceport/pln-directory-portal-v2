'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { updateAiAppFile, UpdateAiAppFileInput } from '@/services/ai-apps/ai-apps.service';

/**
 * Setting/replacing the one-pager via an uploaded file — multipart PATCH.
 * Same invalidation contract as useUpdateAiApp; never triggers a redeploy.
 */
export function useUpdateAiAppFile(uid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAiAppFileInput) => updateAiAppFile(uid, input),
    onSuccess: async (result) => {
      if (result.error) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, uid] }),
        queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APPS_LIST] }),
      ]);
    },
  });
}
