'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/core/ToastContainer';
import {
  updateAiAppFeedbackStatus,
  type AiAppFeedbackRow,
} from '@/services/ai-app-feedback/ai-app-feedback.service';
import { AiAppFeedbackQueryKeys, type AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';

export interface UpdateAiAppFeedbackStatusData {
  appUid: string;
  feedbackUid: string;
  status: AiAppFeedbackStatus;
}

const LIST_QUERY_KEY = [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST];

export function useUpdateAiAppFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appUid, feedbackUid, status }: UpdateAiAppFeedbackStatusData) =>
      updateAiAppFeedbackStatus(appUid, feedbackUid, status),
    onMutate: async ({ feedbackUid, status }: UpdateAiAppFeedbackStatusData) => {
      await queryClient.cancelQueries({ queryKey: LIST_QUERY_KEY });

      const previous = queryClient.getQueryData<AiAppFeedbackRow[]>(LIST_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<AiAppFeedbackRow[]>(
          LIST_QUERY_KEY,
          previous.map((row) => (row.uid === feedbackUid ? { ...row, status } : row)),
        );
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LIST_QUERY_KEY, context.previous);
      }
      toast.error('Something went wrong. Please try again.');
      console.error('Failed to update AI App feedback status:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEY });
    },
  });
}
