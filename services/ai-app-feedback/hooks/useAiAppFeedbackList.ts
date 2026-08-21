'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import {
  fetchAccessibleAiAppFeedback,
  type AiAppFeedbackRow,
} from '@/services/ai-app-feedback/ai-app-feedback.service';

export type { AiAppFeedbackRow };

export function useAiAppFeedbackList() {
  const {
    data: feedback = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST],
    queryFn: fetchAccessibleAiAppFeedback,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    feedback,
    isLoading,
    isError,
  };
}
