'use client';

import { useMutation } from '@tanstack/react-query';
import { submitAiAppFeedback } from '@/services/ai-app-feedback/ai-app-feedback.service';

export interface SubmitAiAppFeedbackData {
  appUid: string;
  message: string;
}

export function useSubmitAiAppFeedback() {
  return useMutation({
    mutationFn: ({ appUid, message }: SubmitAiAppFeedbackData) => submitAiAppFeedback(appUid, message),
    onError: (error) => {
      console.error('Failed to submit AI App feedback:', error);
    },
  });
}
