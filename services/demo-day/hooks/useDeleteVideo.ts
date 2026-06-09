import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTeamPitchEditContext } from '@/components/page/pitch/TeamPitchEditContext';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { deleteTeamPitchVideo } from '@/services/team-pitch/team-pitch-profile.service';
import { invalidateTeamPitchQueries } from '@/services/team-pitch/invalidateTeamPitchQueries';

interface DeleteVideoResponse {
  success: boolean;
  message: string;
}

interface DeleteVideoParams {
  teamUid?: string; // Optional team UID for admin deletes
}

async function deleteVideo(demoDayId: string, params?: DeleteVideoParams): Promise<DeleteVideoResponse> {
  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/teams/${params?.teamUid}/fundraising-profile/video`;

  const response = await customFetch(
    url,
    {
      method: 'DELETE',
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to delete video file');
  }

  const data: DeleteVideoResponse = await response.json();
  return data;
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  const params = useParams();
  const demoDayId = params.demoDayId as string;
  const { pitchSlug } = useTeamPitchEditContext();

  return useMutation({
    mutationFn: (deleteParams?: DeleteVideoParams) =>
      pitchSlug ? deleteTeamPitchVideo(pitchSlug) : deleteVideo(demoDayId, deleteParams),
    onSuccess: (_, variables) => {
      if (pitchSlug) {
        invalidateTeamPitchQueries(queryClient, pitchSlug);
        return;
      }

      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId] });
      if (variables?.teamUid) {
        queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId] });
      }
    },
    onError: (error) => {
      console.error('Failed to delete video:', error);
    },
  });
}
