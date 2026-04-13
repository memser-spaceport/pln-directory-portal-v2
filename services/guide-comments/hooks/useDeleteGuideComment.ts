import { useMutation, useQueryClient } from '@tanstack/react-query';

import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';

import { GuideCommentsQueryKeys } from '../constants';

interface DeleteCommentParams {
  articleUid: string;
  commentUid: string;
}

async function deleteGuideComment(params: DeleteCommentParams): Promise<void> {
  const { authToken } = getCookiesFromClient();
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/articles/comments/${params.commentUid}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${authToken}` } },
    true,
  );
  if (!response?.ok) throw new Error('Failed to delete comment');
}

export function useDeleteGuideComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGuideComment,
    onSuccess: (_data, { articleUid }) => {
      queryClient.invalidateQueries({ queryKey: [GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid] });
    },
  });
}
