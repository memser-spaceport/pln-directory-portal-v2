import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer/utils/toast';

export type InterestType = 'like' | 'connect' | 'invest';

interface ExpressInterestData {
  teamFundraisingProfileUid: string;
  interestType: InterestType;
}

async function expressInterest(data: ExpressInterestData): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/express-interest`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to express interest');
  }

  return true;
}

export function useExpressInterest() {
  return useMutation({
    mutationFn: expressInterest,
    onSuccess: () => {
      toast.success('Connection request sent! Both parties have been notified via email.');
    },
    onError: (error) => {
      toast.error('Connection request failed. Please try again.');
    },
  });
}
