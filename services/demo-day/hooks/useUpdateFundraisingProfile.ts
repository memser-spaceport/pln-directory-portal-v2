import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
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

async function updateFundraisingProfile(
  demoDayId: string,
  data: UpdateFundraisingProfileData,
): Promise<{ success: boolean; teamUid?: string }> {
  const { teamUid, ...bodyData } = data;

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/teams/${teamUid}/fundraising-profile`;

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
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useMutation({
    mutationFn: (data: UpdateFundraisingProfileData) => updateFundraisingProfile(demoDayId, data),
    onSuccess: (result) => {
      // Invalidate the user's own fundraising profile
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE, demoDayId] });
      // If editing another team (admin case), invalidate both team lists
      if (result.teamUid) {
        queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId] });
        queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId] });
      }
    },
    onError: (error) => {
      console.error('Failed to update fundraising profile:', error);
    },
  });
}
