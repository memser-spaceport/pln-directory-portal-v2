import { useMutation, useQueryClient } from '@tanstack/react-query';

import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { toast } from '@/components/core/ToastContainer';

import { GuideCommentsQueryKeys } from '../constants';
import type { IGuideComment, IGuideCommentsResponse } from '../guide-comments.types';

interface LikeParams {
  commentUid: string;
  articleUid: string;
  isLiked: boolean;
}

function applyLikeToggle(comments: IGuideComment[], commentUid: string, isLiked: boolean): IGuideComment[] {
  return comments.map((c) => {
    if (c.uid === commentUid) {
      return {
        ...c,
        likedByMe: !isLiked,
        likesCount: isLiked ? c.likesCount - 1 : c.likesCount + 1,
      };
    }
    if (c.replies.length > 0) {
      return { ...c, replies: applyLikeToggle(c.replies, commentUid, isLiked) };
    }
    return c;
  });
}

async function toggleGuideCommentLike(params: LikeParams): Promise<void> {
  const { authToken } = getCookiesFromClient();
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/articles/comments/${params.commentUid}/like`,
    {
      method: params.isLiked ? 'DELETE' : 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update like');
  }
}

export function useLikeGuideComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleGuideCommentLike,
    onMutate: async ({ commentUid, articleUid, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: [GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid] });
      const prev = queryClient.getQueryData<IGuideCommentsResponse>([
        GuideCommentsQueryKeys.GET_GUIDE_COMMENTS,
        articleUid,
      ]);
      queryClient.setQueryData<IGuideCommentsResponse>(
        [GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid],
        (old) => {
          if (!old) return old;
          return { ...old, data: applyLikeToggle(old.data, commentUid, isLiked) };
        },
      );
      return { prev };
    },
    onError: (error, { articleUid }, context) => {
      if (context?.prev) {
        queryClient.setQueryData([GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid], context.prev);
      }
      toast.error(error.message);
    },
    onSettled: (_data, _error, { articleUid }) => {
      queryClient.invalidateQueries({ queryKey: [GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid] });
    },
  });
}
