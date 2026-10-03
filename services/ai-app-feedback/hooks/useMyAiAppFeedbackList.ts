'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import { fetchMyAiAppFeedback } from '@/services/ai-app-feedback/ai-app-feedback.service';

export function useMyAiAppFeedbackList() {
  const {
    data: feedback = [],
    isLoading,
    isError,
  } = useQuery({
    // Under the review list's key, so the mutations that invalidate that list refresh this one too.
    queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST, 'mine'],
    queryFn: fetchMyAiAppFeedback,
    retry: 2,
  });

  return {
    feedback,
    isLoading,
    isError,
  };
}
