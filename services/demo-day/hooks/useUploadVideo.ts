import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { getVideoUploadUrl, confirmVideoUpload } from '../fundraising-profile.service';
import { uploadToS3 } from '@/utils/s3-upload.utils';

interface UploadVideoResponse {
  success: boolean;
  data: any; // FundraisingProfile
}

interface UploadVideoParams {
  file: File;
  teamUid?: string; // Optional team UID for admin uploads
  onProgress?: (progress: number) => void; // Progress callback
}

async function uploadVideo(demoDayId: string, params: UploadVideoParams): Promise<UploadVideoResponse> {
  const { file, teamUid, onProgress } = params;

  try {
    // Step 1: Get presigned upload URL
    const { uploadUid, presignedUrl } = await getVideoUploadUrl(demoDayId, {
      filename: file.name,
      filesize: file.size,
      mimetype: file.type,
      teamUid,
    });

    // Step 2: Upload to S3 directly
    await uploadToS3(file, presignedUrl, file.type, (progress) => {
      onProgress?.(progress);
    });

    // Step 3: Confirm upload completion
    const result = await confirmVideoUpload(demoDayId, {
      uploadUid,
      teamUid,
    });

    return result;
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('presigned') || error.message.includes('expired')) {
        throw new Error('Upload session expired, please try again');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        throw new Error('Upload failed, please check your connection');
      } else if (error.message.includes('confirm') || error.message.includes('verification')) {
        throw new Error('Upload verification failed, please try again');
      }
    }
    throw error;
  }
}

export function useUploadVideo() {
  const queryClient = useQueryClient();
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useMutation({
    mutationFn: (uploadParams: UploadVideoParams) => uploadVideo(demoDayId, uploadParams),
    onSuccess: (_, variables) => {
      // Invalidate and refetch the fundraising profile data
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId] });
      // Only invalidate admin list if uploading as admin
      if (variables.teamUid) {
        queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId] });
      }
    },
    onError: (error) => {
      console.error('Failed to upload video:', error);
    },
  });
}
