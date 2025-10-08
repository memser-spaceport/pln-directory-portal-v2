import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

interface UpdateFundraiseDescriptionData {
  description: string;
  teamUid?: string; // Optional team UID for admin updates
}

async function updateFundraiseDescription(data: UpdateFundraiseDescriptionData): Promise<boolean> {
  const { description, teamUid } = data;

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/current/teams/${teamUid}/fundraising-profile/description`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile/description`;

  const response = await customFetch(
    url,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update fundraise description');
  }

  return true;
}

export function useUpdateFundraiseDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFundraiseDescription,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST] });

      // If teamUid is provided, also invalidate the admin profiles query
      if (variables.teamUid) {
        queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES] });
      }
    },
    onError: (error) => {
      console.error('Failed to update fundraise description:', error);
    },
  });
}

