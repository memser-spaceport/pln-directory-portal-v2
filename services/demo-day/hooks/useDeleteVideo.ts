import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';

interface DeleteVideoResponse {
  success: boolean;
  message: string;
}

async function deleteVideo(): Promise<DeleteVideoResponse> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile/video`;

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
