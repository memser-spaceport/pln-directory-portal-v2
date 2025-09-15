import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';

interface UploadVideoResponse {
  success: boolean;
  data: {
    videoUploadUid: string;
    videoUpload: string;
    fileName: string;
    fileSize: number;
  };
}

async function uploadVideo(file: File): Promise<UploadVideoResponse> {
  const formData = new FormData();
  formData.append('videoFile', file);

  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile/video`;

  const response = await customFetch(
    url,
    {
      method: 'PUT',
      body: formData,
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to upload video file');
  }

  const data: UploadVideoResponse = await response.json();
  return data;
}

export function useUploadVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadVideo,
    onSuccess: () => {
      // Invalidate and refetch the fundraising profile data
      queryClient.invalidateQueries({ queryKey: ['fundraising-profile'] });
    },
    onError: (error) => {
      console.error('Failed to upload video:', error);
    },
  });
}
