'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { updateAiApp, UpdateAiAppPatch } from '@/services/ai-apps/ai-apps.service';

/** Metadata-only edit (name/description/one-pager) — never triggers a redeploy. */
export function useUpdateAiApp(uid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UpdateAiAppPatch) => updateAiApp(uid, patch),
    onSuccess: async (result) => {
      // The service reports failures as data instead of throwing, so onSuccess
      // fires either way — only refresh caches when the save actually landed.
      if (result.error) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, uid] }),
        queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APPS_LIST] }),
      ]);
    },
  });
}
