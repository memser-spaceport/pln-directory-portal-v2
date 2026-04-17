import { useMutation, useQueryClient } from '@tanstack/react-query';

import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';

import { GuideCommentsQueryKeys } from '../constants';

interface EditCommentParams {
  articleUid: string;
  commentUid: string;
  content: string;
}

async function editGuideComment(params: EditCommentParams): Promise<void> {
  const { authToken } = getCookiesFromClient();
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/articles/comments/${params.commentUid}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ content: params.content }),
    },
    true,
  );
  if (!response?.ok) throw new Error('Failed to edit comment');
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
