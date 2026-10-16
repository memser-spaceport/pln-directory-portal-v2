'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { saveAiAppLinearTarget } from '@/services/ai-apps/ai-apps.service';

export function useSaveAiAppLinearTarget(uid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { teamId: string | null; projectId?: string | null }) => saveAiAppLinearTarget(uid, input),
    onSuccess: async (result) => {
      // Failures come back as data, so onSuccess fires either way.
      if (result.error) return;
      await queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_LINEAR_TARGET, uid] });
    },
  });
}
