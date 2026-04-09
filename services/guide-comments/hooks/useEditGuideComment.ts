import { useMutation, useQueryClient } from '@tanstack/react-query';

import { GuideCommentsQueryKeys } from '../constants';

interface EditCommentParams {
  articleUid: string;
  commentUid: string;
  content: string;
}

async function editGuideComment(_params: EditCommentParams): Promise<void> {
  // TODO: Replace with real API call when endpoint is available
  // const { authToken } = getCookiesFromClient();
  // const response = await customFetch(
  //   `${process.env.DIRECTORY_API_URL}/v1/articles/${_params.articleUid}/comments/${_params.commentUid}`,
  //   {
  //     method: 'PUT',
  //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
  //     body: JSON.stringify({ content: _params.content }),
  //   },
  //   true,
  // );
  // if (!response?.ok) throw new Error('Failed to edit comment');
}

export function useEditGuideComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: editGuideComment,
    onSuccess: (_data, { articleUid }) => {
      queryClient.invalidateQueries({ queryKey: [GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid] });
    },
  });
}
