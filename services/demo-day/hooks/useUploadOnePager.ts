import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';

interface UploadOnePagerResponse {
  success: boolean;
  data: {
    onePagerUploadUid: string;
    onePagerUpload: string;
    fileName: string;
    fileSize: number;
  };
}

interface UploadOnePagerParams {
  file: File;
  teamUid?: string; // Optional team UID for admin uploads
}

async function uploadOnePager(params: UploadOnePagerParams): Promise<UploadOnePagerResponse> {
  const { file, teamUid } = params;
  const formData = new FormData();
  formData.append('onePagerFile', file);

  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/current/teams/${teamUid}/fundraising-profile/one-pager`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile/one-pager`;

  const response = await customFetch(
    url,
    {
      method: 'PUT',
      body: formData,
      // Note: Don't set Content-Type header for FormData, let the browser set it
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to upload one-pager file');
  }

  const data: UploadOnePagerResponse = await response.json();
  return data;
}

export function useUploadOnePager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadOnePager,
    onSuccess: () => {
      // Invalidate and refetch the fundraising profile data
      queryClient.invalidateQueries({ queryKey: ['fundraising-profile'] });
    },
    onError: (error) => {
      console.error('Failed to upload one-pager:', error);
    },
  });
}
