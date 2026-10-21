'use client';

import Link from 'next/link';
import { useCurrentUserStore } from '@/services/auth/store';
import { FeedbackStatus } from '@/services/plaa/feedback/feedback.types';
import {
  useAddComment,
  useChangeStatus,
  useDeleteComment,
  useFeedbackComments,
  useFeedbackItem,
  useFeedbackMe,
  useHideComment,
  useRetryLinear,
  useVote,
} from '@/services/plaa/feedback/useFeedback';
import { usePlaaFeedbackAnalytics } from '@/analytics/plaa-feedback.analytics';
import ItemDetail from './item-detail';
import FeedbackStyles from './feedback-styles';
import { ErrorState, LoadingRows } from './feedback-bits';

/** Wires the detail view to data; the presentational half stays testable. */
export default function ItemDetailContainer({ id }: { id: string }) {
  const analytics = usePlaaFeedbackAnalytics();
  const { data: me } = useFeedbackMe();
  const currentMemberUid = useCurrentUserStore((state) => state.currentUser?.uid);

  const itemQuery = useFeedbackItem(id);
  const commentsQuery = useFeedbackComments(id);

  const vote = useVote();
  const addComment = useAddComment(id);
  const deleteComment = useDeleteComment(id);
  const hideComment = useHideComment(id);
  const changeStatus = useChangeStatus();
  const retryLinear = useRetryLinear();

  if (itemQuery.isLoading) {
    return (
      <div className="fb-page">
        <LoadingRows rows={3} />
        <FeedbackStyles />
      </div>
    );
  }

  // A private item the caller doesn't own comes back 404 from the service; show
  // the same thing for a missing item so neither case reveals the other.
  if (itemQuery.isError || !itemQuery.data) {
    return (
      <div className="fb-page">
        <ErrorState onRetry={() => itemQuery.refetch()} />
        <FeedbackStyles />
      </div>
    );
  }

  const item = itemQuery.data;

  return (
    <div className="fb-page">
      <Link href="/alignment-asset/feedback" className="fb-linkbtn">
        ← All feedback
      </Link>

      <ItemDetail
        item={item}
        comments={commentsQuery.data?.items ?? []}
        isAdmin={me?.is_admin ?? false}
        currentMemberUid={currentMemberUid}
        commentPending={addComment.isPending}
        onVote={() => {
          analytics[item.has_voted ? 'onUnvoted' : 'onVoted'](item.type, item.status);
          vote.mutate({ id: item.id, voted: item.has_voted });
        }}
        onComment={(body) => {
          addComment.mutate(body);
          analytics.onCommentPosted(item.type);
        }}
        onDeleteComment={(commentId) => deleteComment.mutate(commentId)}
        onHideComment={(commentId, hidden) => hideComment.mutate({ commentId, hidden })}
        onMove={(toStatus: FeedbackStatus, note?: string, duplicateOfId?: string) => {
          changeStatus.mutate({ id: item.id, toStatus, note, duplicateOfId });
          analytics.onStatusChanged(item.status, toStatus, Boolean(note));
        }}
        onRetryLinear={() => retryLinear.mutate(item.id)}
      />

      <FeedbackStyles />
    </div>
  );
}
