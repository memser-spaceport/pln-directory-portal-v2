import { useMutation, useQueryClient } from '@tanstack/react-query';

import { GuideCommentsQueryKeys } from '../constants';

interface DeleteCommentParams {
  articleUid: string;
  commentUid: string;
}

async function deleteGuideComment(_params: DeleteCommentParams): Promise<void> {
  // TODO: Replace with real API call when endpoint is available
  // const { authToken } = getCookiesFromClient();
  // const response = await customFetch(
  //   `${process.env.DIRECTORY_API_URL}/v1/articles/${_params.articleUid}/comments/${_params.commentUid}`,
  //   { method: 'DELETE', headers: { Authorization: `Bearer ${authToken}` } },
  //   true,
  // );
  // if (!response?.ok) throw new Error('Failed to delete comment');
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
