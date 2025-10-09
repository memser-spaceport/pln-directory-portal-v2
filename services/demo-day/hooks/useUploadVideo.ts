import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

interface UploadVideoResponse {
  success: boolean;
  data: {
    videoUploadUid: string;
    videoUpload: string;
    fileName: string;
    fileSize: number;
  };
}

interface UploadVideoParams {
  file: File;
  teamUid?: string; // Optional team UID for admin uploads
}

async function uploadVideo(params: UploadVideoParams): Promise<UploadVideoResponse> {
  const { file, teamUid } = params;
  const formData = new FormData();
  formData.append('videoFile', file);

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/current/teams/${teamUid}/fundraising-profile/video`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile/video`;

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
    onSuccess: (_, variables) => {
      // Invalidate and refetch the fundraising profile data
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST] });
      // Only invalidate admin list if uploading as admin
      if (variables.teamUid) {
        queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES] });
      }
    },
    onError: (error) => {
      console.error('Failed to upload video:', error);
    },
  });
}
