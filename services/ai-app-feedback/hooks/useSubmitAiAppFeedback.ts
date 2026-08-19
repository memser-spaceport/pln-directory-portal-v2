'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitAiAppFeedback, type AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import { useCurrentUserStore } from '@/services/auth/store';

export interface SubmitAiAppFeedbackData {
  appUid: string;
  text: string;
}

const LIST_QUERY_KEY = [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST];

export function useSubmitAiAppFeedback() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUserStore();

  return useMutation({
    mutationFn: ({ appUid, text }: SubmitAiAppFeedbackData) => submitAiAppFeedback(appUid, text),
    onMutate: async ({ appUid, text }: SubmitAiAppFeedbackData) => {
      await queryClient.cancelQueries({ queryKey: LIST_QUERY_KEY });

      const previous = queryClient.getQueryData<AiAppFeedbackRow[]>(LIST_QUERY_KEY);
      if (previous) {
        const optimisticRow: AiAppFeedbackRow = {
          uid: `optimistic-${Date.now()}`,
          appUid,
          appName: previous.find((row) => row.appUid === appUid)?.appName ?? '',
          text,
          status: 'NEW',
          createdAt: new Date().toISOString(),
          member: currentUser?.uid ? { uid: currentUser.uid, name: currentUser.name ?? 'You' } : null,
        };
        queryClient.setQueryData<AiAppFeedbackRow[]>(LIST_QUERY_KEY, [optimisticRow, ...previous]);
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LIST_QUERY_KEY, context.previous);
      }
      console.error('Failed to submit AI App feedback:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEY });
    },
  });
}
