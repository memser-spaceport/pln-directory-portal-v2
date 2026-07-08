'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import { fetchAiAppFeedbackList, AiAppFeedback } from '@/services/ai-app-feedback/ai-app-feedback.service';

export function useAiAppFeedbackList() {
  const { data, isLoading, isError } = useQuery<AiAppFeedback[]>({
    queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST],
    queryFn: fetchAiAppFeedbackList,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    feedback: data ?? [],
    isLoading,
    isError,
  };
}
