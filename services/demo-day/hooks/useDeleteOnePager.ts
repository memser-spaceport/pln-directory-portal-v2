import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTeamPitchEditContext } from '@/components/page/pitch/TeamPitchEditContext';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { deleteTeamPitchOnePager } from '@/services/team-pitch/team-pitch-profile.service';
import { invalidateTeamPitchQueries } from '@/services/team-pitch/invalidateTeamPitchQueries';

interface DeleteOnePagerResponse {
  success: boolean;
  message: string;
}

interface DeleteOnePagerParams {
  teamUid?: string; // Optional team UID for admin deletes
}

async function deleteOnePager(demoDayId: string, params?: DeleteOnePagerParams): Promise<DeleteOnePagerResponse> {
  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/teams/${params?.teamUid}/fundraising-profile/one-pager`;

  const response = await customFetch(
    url,
    {
      method: 'DELETE',
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to delete one-pager file');
  }

  const data: DeleteOnePagerResponse = await response.json();
  return data;
}

export function useDeleteOnePager() {
  const queryClient = useQueryClient();
  const params = useParams();
  const demoDayId = params.demoDayId as string;
  const { pitchSlug } = useTeamPitchEditContext();

  return useMutation({
    mutationFn: (deleteParams?: DeleteOnePagerParams) =>
      pitchSlug ? deleteTeamPitchOnePager(pitchSlug) : deleteOnePager(demoDayId, deleteParams),
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
      console.error('Failed to delete one-pager:', error);
    },
  });
}
