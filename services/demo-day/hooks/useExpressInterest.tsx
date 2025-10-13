import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer/utils/toast';

export type InterestType = 'like' | 'connect' | 'invest';

interface ExpressInterestData {
  teamFundraisingProfileUid: string;
  interestType: InterestType;
  isPrepDemoDay?: boolean;
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

export function useExpressInterest(teamName?: string) {
  return useMutation<boolean, Error, ExpressInterestData>({
    mutationFn: expressInterest,
    onSuccess: (_, variables) => {
      const { interestType } = variables;
      let title = '';

      switch (interestType) {
        case 'like':
          title = `You liked ${teamName || '[TeamName]'}`;
          break;
        case 'connect':
          title = `You're connecting with ${teamName || '[TeamName]'}`;
          break;
        case 'invest':
          title = `You expressed interest to invest in ${teamName || '[TeamName]'}`;
          break;
        default:
          title = 'Connection request sent!';
      }

      toast.success(
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{title}</span>
          <br />
          <span style={{ fontSize: '14px' }}>We sent an email to let them know.</span>
        </div>,
        {
          style: {
            width: '320px',
          },
          autoClose: 3000,
        },
      );
    },
    onError: (error) => {
      toast.error('Connection request failed. Please try again.', {
        autoClose: 3000,
      });
    },
  });
}
