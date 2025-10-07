import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

interface UpdateFundraisingProfileData {
  logo?: string;
  name: string;
  shortDescription: string;
  industryTags: string[];
  fundingStage: string;
  teamUid?: string; // Optional team UID for admin edits
}

async function updateFundraisingProfile(data: UpdateFundraisingProfileData): Promise<{ success: boolean; teamUid?: string }> {
  const { teamUid, ...bodyData } = data;

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/teams/${teamUid}/fundraising-profile/admin`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile/team`;

  const response = await customFetch(
    url,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update fundraising profile');
  }

  return { success: true, teamUid };
}

export function useUpdateFundraisingProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFundraisingProfile,
    onSuccess: (result) => {
      // Invalidate the user's own fundraising profile
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE] });
      // Only invalidate the team list if editing another team (admin case)
      if (result.teamUid) {
        queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST] });
      }
    },
    onError: (error) => {
      console.error('Failed to update fundraising profile:', error);
    },
  });
}
