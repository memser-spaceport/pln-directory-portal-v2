import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';

export interface SubmitDemoDayFeedbackData {
  rating: number;
  comment?: string;
  issues?: string[];
}

async function submitDemoDayFeedback(data: SubmitDemoDayFeedbackData): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/feedback`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to submit demo day feedback');
  }

  return true;
}

export function useSubmitDemoDayFeedback() {
  return useMutation({
    mutationFn: submitDemoDayFeedback,
    onError: (error) => {
      console.error('Failed to submit demo day feedback:', error);
    },
  });
}

