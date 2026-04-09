import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/core/ToastContainer';

import { GuideCommentsQueryKeys } from '../constants';
import type { IGuideComment } from '../guide-comments.types';

interface LikeParams {
  commentUid: string;
  articleUid: string;
  isLiked: boolean;
}

async function toggleGuideCommentLike(_params: LikeParams): Promise<void> {
  // TODO: Replace with real API call when endpoint is available
  // const { authToken } = getCookiesFromClient();
  // const url = `${process.env.DIRECTORY_API_URL}/v1/articles/${_params.articleUid}/comments/${_params.commentUid}/like`;
  // const response = await customFetch(
  //   url,
  //   { method: _params.isLiked ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${authToken}` } },
  //   true,
  // );
  // if (!response?.ok) throw new Error('Failed to update like');
}

export function useLikeGuideComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleGuideCommentLike,
    onMutate: async ({ commentUid, articleUid, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: [GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid] });
      const prev = queryClient.getQueryData<IGuideComment[]>([GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid]);
      queryClient.setQueryData<IGuideComment[]>([GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid], (old) => {
        if (!old) return old;
        return old.map((c) =>
          c.uid === commentUid
            ? { ...c, isLiked: !isLiked, totalLikes: isLiked ? c.totalLikes - 1 : c.totalLikes + 1 }
            : c,
        );
      });
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
