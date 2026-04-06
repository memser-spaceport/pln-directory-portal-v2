import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
import { ArticlesQueryKeys } from '@/services/articles/constants';

async function trackView(articleUid: string) {
  const { authToken } = getCookiesFromClient();
  const url = `${process.env.DIRECTORY_API_URL}/v1/articles/${articleUid}/view`;

  await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    },
    true,
  );
}

export function useArticleView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trackView,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ArticlesQueryKeys.ARTICLES_LIST],
      });
    },
  });
}
