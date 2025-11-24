import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { customFetch } from '@/utils/fetch-wrapper';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

interface DeleteOnePagerResponse {
  success: boolean;
  message: string;
}

interface DeleteOnePagerParams {
  teamUid?: string; // Optional team UID for admin deletes
}

async function deleteOnePager(demoDayId: string, params?: DeleteOnePagerParams): Promise<DeleteOnePagerResponse> {
  // If teamUid is provided, use the admin endpoint; otherwise, use the regular endpoint
  const url = params?.teamUid
    ? `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days/${demoDayId}/teams/${params.teamUid}/fundraising-profile/one-pager`
    : `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/fundraising-profile/one-pager`;

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

  return useMutation({
    mutationFn: (deleteParams?: DeleteOnePagerParams) => deleteOnePager(demoDayId, deleteParams),
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
      console.error('Failed to delete one-pager:', error);
    },
  });
}
