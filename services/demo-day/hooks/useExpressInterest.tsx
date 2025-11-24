import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer/utils/toast';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

export type InterestType = 'like' | 'connect' | 'invest' | 'referral';

interface ReferralData {
  investorName: string;
  investorEmail: string;
  message: string;
}

interface ExpressInterestData {
  teamFundraisingProfileUid: string;
  interestType: InterestType;
  isPrepDemoDay?: boolean;
  referralData?: ReferralData;
}

async function expressInterest(demoDayId: string, data: ExpressInterestData): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/express-interest`;

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
  const queryClient = useQueryClient();
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useMutation<boolean, Error, ExpressInterestData>({
    mutationFn: (data: ExpressInterestData) => expressInterest(demoDayId, data),
    onSuccess: (_, variables) => {
      const { interestType, isPrepDemoDay } = variables;
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
        case 'referral':
          title = `${teamName || '[TeamName]'} introduction sent`;
          break;
        default:
          title = 'Connection request sent!';
      }

      toast.success(
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{title}</span>
          <br />
          <span style={{ fontSize: '14px' }}>
            {isPrepDemoDay
              ? `Emails aren't sent to founders in showcase mode.`
              : 'We sent an email to let them know.'}
          </span>
        </div>,
        {
          style: {
            width: '320px',
          },
          autoClose: 3000,
        },
      );

      // Invalidate caches to refetch the updated data with new flags
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATS, demoDayId] });
    },
    onError: (error) => {
      toast.error('Connection request failed. Please try again.', {
        autoClose: 3000,
      });
    },
  });
}
