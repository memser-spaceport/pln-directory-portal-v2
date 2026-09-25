'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { saveAiAppPublicPaths } from '@/services/ai-apps/ai-apps.service';

export function useSaveAiAppPublicPaths(uid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicPaths: string[]) => saveAiAppPublicPaths(uid, publicPaths),
    onSuccess: async (result) => {
      // Failures come back as data, so onSuccess fires either way.
      if (result.error) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_PUBLIC_PATHS, uid] }),
        queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, uid] }),
        queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APPS_LIST] }),
      ]);
    },
  });
}
