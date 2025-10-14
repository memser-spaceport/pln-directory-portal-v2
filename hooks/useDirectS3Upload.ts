import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVideoUploadUrl,
  confirmVideoUpload,
  getOnePagerUploadUrl,
  confirmOnePagerUpload,
} from '@/services/demo-day/fundraising-profile.service';
import { uploadToS3 } from '@/utils/s3-upload.utils';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

export type UploadType = 'video' | 'onePager';

export interface DirectS3UploadParams {
  file: File;
  uploadType: UploadType;
  teamUid?: string; // Optional team UID for admin uploads
  onProgress?: (progress: number) => void; // Progress callback
}

export interface DirectS3UploadResponse {
  success: boolean;
  data: any; // FundraisingProfile
}

async function directS3Upload(params: DirectS3UploadParams): Promise<DirectS3UploadResponse> {
  const { file, uploadType, teamUid, onProgress } = params;

  try {
    // Step 1: Get presigned upload URL based on upload type
    let uploadUid: string;
    let presignedUrl: string;

    if (uploadType === 'video') {
      const result = await getVideoUploadUrl({
        filename: file.name,
        filesize: file.size,
        mimetype: file.type,
        teamUid,
      });
      uploadUid = result.uploadUid;
      presignedUrl = result.presignedUrl;
    } else if (uploadType === 'onePager') {
      const result = await getOnePagerUploadUrl({
        filename: file.name,
        filesize: file.size,
        mimetype: file.type,
        teamUid,
      });
      uploadUid = result.uploadUid;
      presignedUrl = result.presignedUrl;
    } else {
      throw new Error(`Unsupported upload type: ${uploadType}`);
    }

    // Step 2: Upload to S3 directly
    await uploadToS3(file, presignedUrl, file.type, (progress) => {
      onProgress?.(progress);
    });

    // Step 3: Confirm upload completion based on upload type
    let result: DirectS3UploadResponse;

    if (uploadType === 'video') {
      result = await confirmVideoUpload({
        uploadUid,
        teamUid,
      });
    } else if (uploadType === 'onePager') {
      result = await confirmOnePagerUpload({
        uploadUid,
        teamUid,
      });
    } else {
      throw new Error(`Unsupported upload type: ${uploadType}`);
    }

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

export function useDirectS3Upload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: directS3Upload,
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
      console.error('Failed to upload file:', error);
    },
  });
}
