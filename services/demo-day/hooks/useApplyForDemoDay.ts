import { useMutation } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { toast } from '@/components/core/ToastContainer';
import { customFetch } from '@/utils/fetch-wrapper';

export type ApplyForDemoDayPayload = {
  name: string;
  email: string;
  linkedin: string;
  role: string;
  teamOrProject: string;
  isInvestor: boolean;
};

async function mutation(demoDaySlug: string, payload: ApplyForDemoDayPayload) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDaySlug}/investor-application`;

  // Check if user is authenticated
  const authToken = Cookies.get('authToken');
  const isAuthenticated = Boolean(authToken);

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    isAuthenticated, // Only include auth token if user is logged in
  );

  if (!response?.ok) {
    throw new Error('Failed to submit application');
  }

  return await response.json();
}

export function useApplyForDemoDay(demoDaySlug: string) {
  return useMutation({
    mutationFn: (payload: ApplyForDemoDayPayload) => mutation(demoDaySlug, payload),
    onSuccess: () => {
      toast.success('Your application has been submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit application. Please try again.');
    },
  });
}
