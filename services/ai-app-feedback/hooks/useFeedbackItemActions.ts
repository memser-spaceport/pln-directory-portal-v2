'use client';

import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/core/ToastContainer';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import {
  deleteFeedbackItem,
  editFeedbackNote,
  type OverlayFeedbackPin,
} from '@/services/ai-app-feedback/ai-app-feedback.service';

/** Every pins query for the app (each scope and resolved filter keeps its own). */
const pinsKey = (appUid: string) => [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_PINS, appUid];

type PinsSnapshot = Array<[readonly unknown[], OverlayFeedbackPin[] | undefined]>;

export function isGone(error: unknown): boolean {
  return (error as { status?: number } | null)?.status === 404;
}

function patchPins(
  queryClient: QueryClient,
  appUid: string,
  update: (pins: OverlayFeedbackPin[]) => OverlayFeedbackPin[],
): PinsSnapshot {
  const snapshot = queryClient.getQueriesData<OverlayFeedbackPin[]>({ queryKey: pinsKey(appUid) });
  queryClient.setQueriesData<OverlayFeedbackPin[]>({ queryKey: pinsKey(appUid) }, (pins) =>
    Array.isArray(pins) ? update(pins) : pins,
  );
  return snapshot;
}

function restorePins(queryClient: QueryClient, snapshot: PinsSnapshot | undefined) {
  snapshot?.forEach(([key, pins]) => queryClient.setQueryData(key, pins));
}

function refreshFeedback(queryClient: QueryClient, appUid: string) {
  queryClient.invalidateQueries({ queryKey: pinsKey(appUid) });
  queryClient.invalidateQueries({ queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST] });
}

/**
 * Someone deleted the item while it was open here: its pins leave the page
 * (which closes its thread) and the member is told why their action did nothing.
 */
export function forgetFeedbackItem(queryClient: QueryClient, appUid: string, feedbackUid: string) {
  patchPins(queryClient, appUid, (pins) => pins.filter((pin) => pin.feedbackUid !== feedbackUid));
  toast.error('This comment was deleted.');
}

/** Change your comment's note. It reads "edited" at once, and goes back if the API refuses. */
export function useEditFeedbackNote(appUid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ feedbackUid, note }: { feedbackUid: string; note: string }) =>
      editFeedbackNote(appUid, feedbackUid, note),
    onMutate: async ({ feedbackUid, note }) => {
      await queryClient.cancelQueries({ queryKey: pinsKey(appUid) });
      const editedAt = new Date().toISOString();
      const snapshot = patchPins(queryClient, appUid, (pins) =>
        pins.map((pin) =>
          pin.feedbackUid === feedbackUid ? { ...pin, note, feedback: { ...pin.feedback, editedAt } } : pin,
        ),
      );
      return { snapshot };
    },
    onError: (error, { feedbackUid }, context) => {
      restorePins(queryClient, context?.snapshot);
      if (isGone(error)) forgetFeedbackItem(queryClient, appUid, feedbackUid);
      else toast.error('Couldn’t save your edit. Try again.');
    },
    onSettled: () => refreshFeedback(queryClient, appUid),
  });
}

/** Delete a comment with its replies (its author, or an admin). Its pin goes at once. */
export function useDeleteFeedbackItem(appUid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedbackUid: string) => deleteFeedbackItem(appUid, feedbackUid),
    onMutate: async (feedbackUid: string) => {
      await queryClient.cancelQueries({ queryKey: pinsKey(appUid) });
      const snapshot = patchPins(queryClient, appUid, (pins) => pins.filter((pin) => pin.feedbackUid !== feedbackUid));
      return { snapshot };
    },
    onError: (error, _feedbackUid, context) => {
      /* Already gone is what was asked for. */
      if (isGone(error)) return;
      restorePins(queryClient, context?.snapshot);
      toast.error('Couldn’t delete the comment. Try again.');
    },
    onSettled: () => refreshFeedback(queryClient, appUid),
  });
}
