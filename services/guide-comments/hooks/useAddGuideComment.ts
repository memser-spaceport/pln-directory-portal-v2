import { useMutation, useQueryClient } from '@tanstack/react-query';

import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';

import { GuideCommentsQueryKeys } from '../constants';

interface AddCommentParams {
  articleUid: string;
  content: string;
}

async function addGuideComment(params: AddCommentParams): Promise<void> {
  const { authToken } = getCookiesFromClient();
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/articles/${params.articleUid}/comments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ content: params.content }),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to add comment');
  }
}

export function useAddGuideComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addGuideComment,
    onSuccess: (_data, { articleUid }) => {
      queryClient.invalidateQueries({ queryKey: [GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid] });
    },
  });
}
