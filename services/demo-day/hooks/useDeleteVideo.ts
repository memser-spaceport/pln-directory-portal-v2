import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';

interface DeleteVideoResponse {
  success: boolean;
  message: string;
}

interface DeleteVideoParams {
  teamUid?: string; // Optional team UID for admin deletes
}

async function deleteVideo(params?: DeleteVideoParams): Promise<DeleteVideoResponse> {
  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = params?.teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/current/teams/${params.teamUid}/fundraising-profile/video`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile/video`;

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

  return useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      // Invalidate and refetch the fundraising profile data
      queryClient.invalidateQueries({ queryKey: ['fundraising-profile'] });
    },
    onError: (error) => {
      console.error('Failed to delete video:', error);
    },
  });
}
