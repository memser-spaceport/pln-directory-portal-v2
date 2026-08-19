'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/core/ToastContainer';
import { AiAppFeedback, updateAiAppFeedbackStatus } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { AiAppFeedbackQueryKeys, type AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';

export interface UpdateAiAppFeedbackStatusData {
  appUid: string;
  feedbackUid: string;
  status: AiAppFeedbackStatus;
}

export function useUpdateAiAppFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appUid, feedbackUid, status }: UpdateAiAppFeedbackStatusData) =>
      updateAiAppFeedbackStatus(appUid, feedbackUid, status),
    onMutate: async ({ appUid, feedbackUid, status }: UpdateAiAppFeedbackStatusData) => {
      const queryKey = [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST, appUid];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<AiAppFeedback[]>(queryKey);
      if (previous) {
        queryClient.setQueryData<AiAppFeedback[]>(
          queryKey,
          previous.map((row) => (row.uid === feedbackUid ? { ...row, status } : row)),
        );
      }

      return { previous, queryKey };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      toast.error('Something went wrong. Please try again.');
      console.error('Failed to update AI App feedback status:', error);
    },
    onSettled: (_data, _error, { appUid }) => {
      queryClient.invalidateQueries({ queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST, appUid] });
    },
  });
}
