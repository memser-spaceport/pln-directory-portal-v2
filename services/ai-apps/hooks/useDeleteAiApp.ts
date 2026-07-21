'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { deleteAiApp } from '@/services/ai-apps/ai-apps.service';

/**
 * Callers must unmount every modal consuming the detail query BEFORE this
 * mutation resolves — removeQueries on a key with an active observer triggers
 * a refetch into a dead record.
 */
export function useDeleteAiApp(uid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAiApp(uid),
    onSuccess: async (result) => {
      if (!result.ok) return;
      queryClient.removeQueries({ queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, uid] });
      await queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APPS_LIST] });
    },
  });
}
