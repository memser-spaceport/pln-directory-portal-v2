'use client';

import { useMutation } from '@tanstack/react-query';
import { submitAiAppFeedback } from '@/services/ai-app-feedback/ai-app-feedback.service';

export interface SubmitAiAppFeedbackData {
  appUid: string;
  text: string;
}

export function useSubmitAiAppFeedback() {
  return useMutation({
    mutationFn: ({ appUid, text }: SubmitAiAppFeedbackData) => submitAiAppFeedback(appUid, text),
    onError: (error) => {
      console.error('Failed to submit AI App feedback:', error);
    },
  });
}
