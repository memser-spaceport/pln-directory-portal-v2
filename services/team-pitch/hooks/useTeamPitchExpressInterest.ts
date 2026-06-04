import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer/utils/toast';

export type PitchInterestType = 'connect' | 'invest' | 'referral' | 'feedback';

export function useTeamPitchExpressInterest(pitchSlug: string, teamName?: string) {
  return useMutation({
    mutationFn: async (data: {
      teamPitchProfileUid: string;
      interestType: PitchInterestType;
      isPrep?: boolean;
      referralData?: { investorName?: string; investorEmail?: string; message?: string };
      feedbackData?: { feedback?: string };
    }) => {
      const url = `${process.env.DIRECTORY_API_URL}/v1/team-pitches/${pitchSlug}/express-interest`;
      const response = await customFetch(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        true,
      );
      if (!response?.ok) throw new Error('Failed to express interest');
      return true;
    },
    onSuccess: (_data, variables) => {
      if (variables.isPrep) {
        toast.success('Practice action recorded (no email sent)');
        return;
      }
      const labels: Record<PitchInterestType, string> = {
        connect: 'Connect request sent',
        invest: 'Investment interest sent',
        referral: 'Introduction sent',
        feedback: 'Feedback sent',
      };
      toast.success(labels[variables.interestType] || 'Sent');
    },
    onError: () => {
      toast.error('Something went wrong. Please try again.');
    },
  });
}
