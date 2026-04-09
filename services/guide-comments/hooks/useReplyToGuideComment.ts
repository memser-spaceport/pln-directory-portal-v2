import { useMutation, useQueryClient } from '@tanstack/react-query';

import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';

import { GuideCommentsQueryKeys } from '../constants';

interface ReplyParams {
  articleUid: string;
  parentUid: string;
  content: string;
}

async function replyToGuideComment(params: ReplyParams): Promise<void> {
  const { authToken } = getCookiesFromClient();
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/articles/${params.articleUid}/comments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ content: params.content, parentUid: params.parentUid }),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to add reply');
  }
}

export function useReplyToGuideComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: replyToGuideComment,
    onSuccess: (_data, { articleUid }) => {
      queryClient.invalidateQueries({ queryKey: [GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid] });
    },
  });
}
