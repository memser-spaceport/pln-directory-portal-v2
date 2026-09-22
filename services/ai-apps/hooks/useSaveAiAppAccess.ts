'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { AiAppAccessMode, saveAiAppAccess } from '@/services/ai-apps/ai-apps.service';

export function useSaveAiAppAccess(uid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { access: AiAppAccessMode; memberUids: string[] }) => saveAiAppAccess(uid, input),
    onSuccess: async (result) => {
      // Failures come back as data, so onSuccess fires either way.
      if (result.error) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_ACCESS, uid] }),
        queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, uid] }),
        queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APPS_LIST] }),
      ]);
    },
  });
}
