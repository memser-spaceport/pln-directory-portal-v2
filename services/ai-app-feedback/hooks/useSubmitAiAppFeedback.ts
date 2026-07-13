'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AiAppFeedback, submitAiAppFeedback } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import { useCurrentUserStore } from '@/services/auth/store';

export interface SubmitAiAppFeedbackData {
  appUid: string;
  text: string;
}

export function useSubmitAiAppFeedback() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUserStore();

  return useMutation({
    mutationFn: ({ appUid, text }: SubmitAiAppFeedbackData) => submitAiAppFeedback(appUid, text),
    // Optimistically prepend the new row to the per-app feedback cache so the
    // "View feedback" badge and review table update without a reload. Only an
    // already-cached list is touched - if the viewer can't review this app,
    // there's no cache entry to update and nothing should appear anyway.
    onMutate: async ({ appUid, text }: SubmitAiAppFeedbackData) => {
      const queryKey = [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST, appUid];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<AiAppFeedback[]>(queryKey);
      if (previous) {
        const optimisticRow: AiAppFeedback = {
          uid: `optimistic-${Date.now()}`,
          appUid,
          text,
          createdAt: new Date().toISOString(),
          member: currentUser?.uid ? { uid: currentUser.uid, name: currentUser.name ?? 'You' } : null,
        };
        queryClient.setQueryData<AiAppFeedback[]>(queryKey, [optimisticRow, ...previous]);
      }

      return { previous, queryKey };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      console.error('Failed to submit AI App feedback:', error);
    },
    // Refetch regardless of outcome so the optimistic row (with its fake uid)
    // is replaced by the server's canonical list.
    onSettled: (_data, _error, { appUid }) => {
      queryClient.invalidateQueries({ queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST, appUid] });
    },
  });
}
