import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

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

  return useMutation({
    mutationFn: (deleteParams?: DeleteVideoParams) => deleteVideo(demoDayId, deleteParams),
    onSuccess: (_, variables) => {
      // Invalidate and refetch the fundraising profile data
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId] });
      // Only invalidate admin list if deleting as admin
      if (variables?.teamUid) {
        queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId] });
      }
    },
    onError: (error) => {
      console.error('Failed to delete video:', error);
    },
  });
}
