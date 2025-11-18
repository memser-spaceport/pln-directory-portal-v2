import { useMutation } from '@tanstack/react-query';
import { toast } from '@/components/core/ToastContainer';

export type ApplyForDemoDayPayload = {
  name: string;
  email: string;
  linkedin: string;
  role: string;
  teamOrProject: string;
  isInvestor: boolean;
};

async function mutation(payload: ApplyForDemoDayPayload) {
  // TODO: Replace with actual API endpoint when backend is ready
  // const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/demo-days/applications`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   credentials: 'include',
  //   body: JSON.stringify(payload),
  // });
  //
  // if (!response?.ok) {
  //   throw new Error('Failed to submit application');
  // }
  //
  // return await response.json();

  // Mock implementation for now
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Demo Day Application submitted:', payload);
      resolve({ success: true, message: 'Application submitted successfully' });
    }, 1000);
  });
}

export function useApplyForDemoDay() {
  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      toast.success('Your application has been submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit application. Please try again.');
    },
  });
}
