import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';

interface DeleteOnePagerResponse {
  success: boolean;
  message: string;
}

async function deleteOnePager(): Promise<DeleteOnePagerResponse> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile/one-pager`;

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

  return useMutation({
    mutationFn: deleteOnePager,
    onSuccess: () => {
      // Invalidate and refetch the fundraising profile data
      queryClient.invalidateQueries({ queryKey: ['fundraising-profile'] });
    },
    onError: (error) => {
      console.error('Failed to delete one-pager:', error);
    },
  });
}
