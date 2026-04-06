import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer';
import { ArticlesQueryKeys } from '@/services/articles/constants';
import type { IArticlesResponse } from '@/types/articles.types';

interface LikeMutationParams {
  uid: string;
  isLiked: boolean;
}

async function toggleLike({ uid, isLiked }: LikeMutationParams) {
  const { authToken } = getCookiesFromClient();
  const url = `${process.env.DIRECTORY_API_URL}/v1/articles/${uid}/like`;

  const response = await customFetch(
    url,
    {
      method: isLiked ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update like');
  }
}

export function useArticleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleLike,
    onMutate: async ({ uid, isLiked }) => {
      await queryClient.cancelQueries({
        queryKey: [ArticlesQueryKeys.ARTICLES_LIST],
      });

      const prev = queryClient.getQueryData<IArticlesResponse>([ArticlesQueryKeys.ARTICLES_LIST]);

      queryClient.setQueryData<IArticlesResponse>([ArticlesQueryKeys.ARTICLES_LIST], (old) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.map((a) =>
            a.uid === uid
              ? {
                  ...a,
                  isLiked: !isLiked,
                  totalLikes: isLiked ? a.totalLikes - 1 : a.totalLikes + 1,
                }
              : a,
          ),
        };
      });

      return { prev };
    },
    onError: (error, _variables, context) => {
      if (context?.prev) {
        queryClient.setQueryData([ArticlesQueryKeys.ARTICLES_LIST], context.prev);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [ArticlesQueryKeys.ARTICLES_LIST],
      });
    },
  });
}
