import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { getOnePagerUploadUrl, confirmOnePagerUpload, uploadOnePagerPreview } from '../fundraising-profile.service';
import { uploadToS3 } from '@/utils/s3-upload.utils';
import { generatePdfPreview } from '@/utils/pdf-preview.utils';

interface UploadOnePagerResponse {
  success: boolean;
  data: any; // FundraisingProfile
}

interface UploadOnePagerParams {
  file: File;
  teamUid?: string; // Optional team UID for admin uploads
  onProgress?: (progress: number) => void; // Progress callback
}

async function uploadOnePager(params: UploadOnePagerParams): Promise<UploadOnePagerResponse> {
  const { file, teamUid, onProgress } = params;

  try {
    // Step 1: Get presigned upload URL
    const { uploadUid, presignedUrl } = await getOnePagerUploadUrl({
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
    const result = await confirmOnePagerUpload({
      uploadUid,
      teamUid,
    });

    // Step 4: Generate and upload preview image for PDFs
    try {
      if (file.type === 'application/pdf') {
        console.log('generatePdfPreview');
        const previewImage = await generatePdfPreview(file, 1.0, 0.8);

        await uploadOnePagerPreview({
          previewImage,
          teamUid,
        });
      }
    } catch (previewError) {
      // Log preview generation/upload error but don't fail the main upload
      console.warn('Failed to generate/upload preview image:', previewError);
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

export function useUploadOnePager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadOnePager,
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
      console.error('Failed to upload one-pager:', error);
    },
  });
}
