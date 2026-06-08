import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTeamPitchEditContext } from '@/components/page/pitch/TeamPitchEditContext';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { updateTeamPitchTeam } from '@/services/team-pitch/team-pitch-profile.service';
import { invalidateTeamPitchQueries } from '@/services/team-pitch/invalidateTeamPitchQueries';

interface UpdateFundraisingProfileData {
  logo?: string;
  name: string;
  shortDescription: string;
  industryTags: string[];
  fundingStage?: string;
  program?: string;
  teamUid?: string; // Optional team UID for admin edits
}

async function updateFundraisingProfile(
  demoDayId: string,
  data: UpdateFundraisingProfileData,
): Promise<{ success: boolean; teamUid?: string }> {
  const { teamUid, ...bodyData } = data;

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/teams/${teamUid}/fundraising-profile/team`;

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
  const { pitchSlug } = useTeamPitchEditContext();

  return useMutation({
    mutationFn: (data: UpdateFundraisingProfileData) => {
      if (pitchSlug) {
        const { teamUid: _teamUid, program: _program, ...body } = data;
        return updateTeamPitchTeam(pitchSlug, body);
      }
      return updateFundraisingProfile(demoDayId, data);
    },
    onSuccess: (result) => {
      if (pitchSlug) {
        invalidateTeamPitchQueries(queryClient, pitchSlug);
        return;
      }

      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE, demoDayId] });
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
