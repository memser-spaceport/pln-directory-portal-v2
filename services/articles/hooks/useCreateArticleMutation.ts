import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer';
import { ArticlesQueryKeys } from '@/services/articles/constants';

// Placeholder payload — to be updated once the real API contract is defined
type CreateArticlePayload = {
  title: string;
  summary?: string;
  category: string;
  content: string;
  authorMemberUid?: string;
  authorTeamUid?: string;
  officeHoursUrl?: string;
  status: 'PUBLISHED';
};

async function mutation(payload: CreateArticlePayload) {
  const { authToken } = getCookiesFromClient();
  const url = `${process.env.DIRECTORY_API_URL}/v1/articles`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    },
    true,
  );

  if (response?.ok) {
    toast.success('Guide published successfully!');
    return await response.json();
  } else {
    toast.error('Something went wrong!');
    return null;
  }
}

export function useCreateArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ArticlesQueryKeys.ARTICLES_LIST],
      });
    },
  });
}
