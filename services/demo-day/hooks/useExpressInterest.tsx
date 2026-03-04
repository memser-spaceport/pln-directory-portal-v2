import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer/utils/toast';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

export type InterestType = 'like' | 'connect' | 'invest' | 'referral' | 'feedback';

interface ReferralData {
  investorName: string;
  investorEmail: string;
  message: string;
}

interface FeedbackData {
  feedback: string;
}

import type { DemoDayModeType } from './useDemoDayMode';

interface ExpressInterestData {
  teamFundraisingProfileUid: string;
  interestType: InterestType;
  isPrepDemoDay?: boolean;
  demoDayMode?: DemoDayModeType;
  referralData?: ReferralData;
  feedbackData?: FeedbackData;
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
      const { interestType, isPrepDemoDay, demoDayMode } = variables;
      const mode = demoDayMode ?? (isPrepDemoDay ? 'showcase' : null);
      const teamDisplay = teamName || '[TeamName]';

      const getPrepShowcaseMessage = (action: string) =>
        `${mode === 'prep' ? 'Prep' : 'Showcase'} mode — ${action} not sent to ${teamDisplay}\n(In live Demo Day, founders would receive this)`;

      let content: React.ReactNode;
      if (mode && interestType !== 'like') {
        const messages: Record<string, string> = {
          connect: getPrepShowcaseMessage('Connection request'),
          feedback: getPrepShowcaseMessage('Feedback'),
          referral: getPrepShowcaseMessage('Introduction'),
          invest: getPrepShowcaseMessage('Investment interest'),
        };
        const msg = messages[interestType];
        content = msg ? (
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{msg.split('\n')[0]}</span>
            <br />
            <span style={{ fontSize: '14px' }}>{msg.split('\n')[1]}</span>
          </div>
        ) : null;
      }

      if (!content) {
        let title = '';
        switch (interestType) {
          case 'like':
            title = `You saved ${teamDisplay}`;
            break;
          case 'connect':
            title = `You're connecting with ${teamDisplay}`;
            break;
          case 'invest':
            title = `You expressed interest to invest in ${teamDisplay}`;
            break;
          case 'referral':
            title = `${teamDisplay} introduction sent`;
            break;
          case 'feedback':
            title = `Feedback sent to ${teamDisplay}`;
            break;
          default:
            title = 'Connection request sent!';
        }
        content = (
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{title}</span>
            {interestType !== 'like' && (
              <>
                <br />
                <span style={{ fontSize: '14px' }}>We sent an email to let them know.</span>
              </>
            )}
          </div>
        );
      }

      toast.success(
        content,
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
      toast.error(error?.message || 'Connection request failed. Please try again.', {
        autoClose: 3000,
      });
    },
  });
}
