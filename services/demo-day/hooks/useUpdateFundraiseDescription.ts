import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTeamPitchEditContext } from '@/components/page/pitch/TeamPitchEditContext';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { updateTeamPitchDescription } from '@/services/team-pitch/team-pitch-profile.service';
import { invalidateTeamPitchQueries } from '@/services/team-pitch/invalidateTeamPitchQueries';

interface UpdateFundraiseDescriptionData {
  description: string;
  teamUid?: string; // Optional team UID for admin updates
}

async function updateFundraiseDescription(demoDayId: string, data: UpdateFundraiseDescriptionData): Promise<boolean> {
  const { description, teamUid } = data;

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/teams/${teamUid}/fundraising-profile/description`;

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
  const params = useParams();
  const demoDayId = params.demoDayId as string;
  const { pitchSlug } = useTeamPitchEditContext();

  return useMutation({
    mutationFn: (data: UpdateFundraiseDescriptionData) =>
      pitchSlug ? updateTeamPitchDescription(pitchSlug, data.description) : updateFundraiseDescription(demoDayId, data),
    onSuccess: (_data, variables) => {
      if (pitchSlug) {
        invalidateTeamPitchQueries(queryClient, pitchSlug);
        return;
      }

      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId] });

      if (variables.teamUid) {
        queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId] });
      }
    },
    onError: (error) => {
      console.error('Failed to update fundraise description:', error);
    },
  });
}
