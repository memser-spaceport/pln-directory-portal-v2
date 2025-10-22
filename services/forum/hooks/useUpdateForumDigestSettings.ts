import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { ForumQueryKeys } from '@/services/forum/constants';

async function mutation({ uid, payload }: { uid: string; payload: any }) {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/forum`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    const res = await response?.json();
    throw new Error(res?.status.message || 'Failed to update digest settings');
  }

  return await response.json();
}

export function useUpdateForumDigestSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onMutate: async ({ uid, payload }) => {
      await queryClient.cancelQueries({
        queryKey: [ForumQueryKeys.GET_FORUM_DIGEST_SETTINGS],
      });

      const prev = queryClient.getQueryData([ForumQueryKeys.GET_FORUM_DIGEST_SETTINGS, uid]);

      queryClient.setQueryData([ForumQueryKeys.GET_FORUM_DIGEST_SETTINGS, uid], (old: any) => {
        if (!old) {
          return old;
        }

        return {
          ...old,
          ...payload,
        };
      });

      return { prev };
    },
    onError: (error, { uid }, context) => {
      if (context?.prev) {
        queryClient.setQueryData([ForumQueryKeys.GET_FORUM_DIGEST_SETTINGS, uid], context.prev);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ForumQueryKeys.GET_FORUM_DIGEST_SETTINGS],
      });
    },
  });
}
