import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer';
import { ArticlesQueryKeys } from '@/services/articles/constants';

type UpdateArticlePayload = {
  uid: string;
  title: string;
  summary?: string;
  category: string;
  content: string;
  authorMemberUid?: string;
  authorTeamUid?: string;
  readingTime?: number;
  officeHoursUrl?: string;
  status: 'PUBLISHED';
};

async function mutation(payload: UpdateArticlePayload) {
  const { authToken } = getCookiesFromClient();
  const { uid, ...rest } = payload;

  const url = `${process.env.DIRECTORY_API_URL}/v1/articles/${uid}`;

  const response = await customFetch(
    url,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(rest),
    },
    true,
  );

  if (response?.ok) {
    toast.success('Guide updated successfully!');
    return await response.json();
  } else {
    toast.error('Something went wrong!');
    return null;
  }
}

export function useUpdateArticleMutation() {
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
