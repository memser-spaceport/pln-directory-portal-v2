'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/core/ToastContainer';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import { forgetFeedbackItem, isGone } from '@/services/ai-app-feedback/hooks/useFeedbackItemActions';
import {
  deleteFeedbackComment,
  editFeedbackComment,
  fetchFeedbackComments,
  postFeedbackComment,
  type AiAppFeedbackComment,
} from '@/services/ai-app-feedback/ai-app-feedback.service';

const NO_COMMENTS: AiAppFeedbackComment[] = [];

const commentsKey = (appUid: string, feedbackUid: string) => [
  AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_COMMENTS,
  appUid,
  feedbackUid,
];

/**
 * One feedback item's conversation, oldest first. Fetched only while it is on
 * screen (`enabled`); refetched on focus, so a reply from someone else shows up
 * the next time the thread is looked at. Callers gate `enabled` on being signed
 * in: customFetch reloads the page on a missing session.
 */
export function useFeedbackComments(appUid: string, feedbackUid: string, enabled: boolean) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: commentsKey(appUid, feedbackUid),
    queryFn: () => fetchFeedbackComments(appUid, feedbackUid),
    enabled: enabled && Boolean(appUid && feedbackUid),
    retry: 1,
  });
  /* An array or nothing: the global jest mock of useQuery returns an object. */
  return { comments: Array.isArray(data) ? data : NO_COMMENTS, isLoading, isError, refetch };
}

type Author = AiAppFeedbackComment['member'];

/**
 * Send a reply. It shows at once, greyed until the API confirms; on failure it
 * is taken back out and the caller gets the rejection (to put the text back in
 * the field). Pins and the Feedback list carry the reply count, so both refresh.
 */
export function useAddFeedbackComment(appUid: string, feedbackUid: string, author: Author) {
  const queryClient = useQueryClient();
  const key = commentsKey(appUid, feedbackUid);
  return useMutation({
    mutationFn: (text: string) => postFeedbackComment(appUid, feedbackUid, text),
    onMutate: async (text: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<AiAppFeedbackComment[]>(key);
      const optimistic: AiAppFeedbackComment = {
        uid: `pending-${Date.now()}`,
        text,
        kind: 'REPLY',
        createdAt: new Date().toISOString(),
        member: author,
        pending: true,
      };
      queryClient.setQueryData<AiAppFeedbackComment[]>(key, [...(previous ?? []), optimistic]);
      return { previous, optimisticUid: optimistic.uid };
    },
    /* The stored reply replaces its stand-in, so it stops reading "Sending…" even
       when the thread's query is idle (a first reply on an item that had none). */
    onSuccess: (comment, _text, context) => {
      queryClient.setQueryData<AiAppFeedbackComment[]>(key, (list) =>
        (list ?? []).map((c) => (c.uid === context?.optimisticUid ? comment : c)),
      );
    },
    onError: (error, _text, context) => {
      queryClient.setQueryData(key, context?.previous);
      if (isGone(error)) forgetFeedbackItem(queryClient, appUid, feedbackUid);
      else toast.error('Your reply didn’t send. It’s back in the field; try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_PINS] });
      queryClient.invalidateQueries({ queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST] });
    },
  });
}

/** Delete one of your replies; it goes at once and comes back if the API refuses. */
export function useDeleteFeedbackComment(appUid: string, feedbackUid: string) {
  const queryClient = useQueryClient();
  const key = commentsKey(appUid, feedbackUid);
  return useMutation({
    mutationFn: (commentUid: string) => deleteFeedbackComment(appUid, feedbackUid, commentUid),
    onMutate: async (commentUid: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<AiAppFeedbackComment[]>(key);
      queryClient.setQueryData<AiAppFeedbackComment[]>(
        key,
        (previous ?? []).filter((c) => c.uid !== commentUid),
      );
      return { previous };
    },
    onError: (error, _uid, context) => {
      /* Already gone is what was asked for. */
      if (isGone(error)) return;
      queryClient.setQueryData(key, context?.previous);
      toast.error('Couldn’t delete the reply. Try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_PINS] });
      queryClient.invalidateQueries({ queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST] });
    },
  });
}

/** Change one of your replies. The new text shows at once, marked edited; it goes back if the API refuses. */
export function useEditFeedbackComment(appUid: string, feedbackUid: string) {
  const queryClient = useQueryClient();
  const key = commentsKey(appUid, feedbackUid);
  return useMutation({
    mutationFn: ({ commentUid, text }: { commentUid: string; text: string }) =>
      editFeedbackComment(appUid, feedbackUid, commentUid, text),
    onMutate: async ({ commentUid, text }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<AiAppFeedbackComment[]>(key);
      const editedAt = new Date().toISOString();
      queryClient.setQueryData<AiAppFeedbackComment[]>(
        key,
        (previous ?? []).map((c) => (c.uid === commentUid ? { ...c, text, editedAt } : c)),
      );
      return { previous };
    },
    onSuccess: (comment) => {
      queryClient.setQueryData<AiAppFeedbackComment[]>(key, (list) =>
        (list ?? []).map((c) => (c.uid === comment.uid ? comment : c)),
      );
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
      toast.error(isGone(error) ? 'That reply was deleted.' : 'Couldn’t save your edit. Try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
