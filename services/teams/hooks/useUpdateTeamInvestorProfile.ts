import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer';
import { TeamsQueryKeys } from '@/services/teams/constants';

interface TeamInvestorProfilePayload {
  role?: string;
  investmentTeam?: boolean;
  isFund?: boolean;
  memberUid?: string;
  website?: string;
  investorProfile?: {
    investmentFocus?: string[];
    investInStartupStages?: string[];
    investInFundTypes?: string[];
    typicalCheckSize?: number;
  };
}

interface MutationParams {
  teamUid: string;
  payload: TeamInvestorProfilePayload;
}

async function mutation({ teamUid, payload }: MutationParams) {
  const { authToken } = getCookiesFromClient();

  if (!authToken) {
    throw new Error('Cannot get auth token');
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/teams/${teamUid}/profile-update`;

  const response = await customFetch(
    url,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    },
    true,
  );

  if (response?.ok) {
    // toast.success('Team investor profile updated successfully');
    return await response.json();
  } else {
    toast.error('Failed to update team investor profile');
    throw new Error('Failed to update team investor profile');
  }
}

export function useUpdateTeamInvestorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      // Invalidate team queries to refetch updated data
      queryClient.invalidateQueries({
        queryKey: [TeamsQueryKeys.GET_TEAM],
      });

      queryClient.invalidateQueries({
        queryKey: [TeamsQueryKeys.GET_TEAMS_LIST],
      });
    },
  });
}
