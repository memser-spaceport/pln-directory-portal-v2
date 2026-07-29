'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InvestorsQueryKeys } from '../constants';
import { clearWarmPathRefer, upsertWarmPathFeedback } from '../warm-intros-v2.service';
import type {
  UpsertWarmPathFeedbackBody,
  WarmIntrosV2InvestorPathsResponse,
  WarmPathCanRefer,
  WarmPathMyFeedback,
} from '../warm-intros-v2.types';

function patchMyFeedback(
  prev: WarmIntrosV2InvestorPathsResponse | undefined,
  warmPathUid: string,
  connectorProfileUid: string,
  next: WarmPathMyFeedback | null,
): WarmIntrosV2InvestorPathsResponse | undefined {
  if (!prev) return prev;
  return {
    ...prev,
    paths: prev.paths.map((path) => {
      if (path.uid !== warmPathUid) return path;
      const map = { ...(path.myFeedbackByConnector ?? {}) };
      if (next == null || (next.canRefer == null && !next.note)) {
        delete map[connectorProfileUid];
      } else {
        map[connectorProfileUid] = next;
      }
      return {
        ...path,
        myFeedbackByConnector: Object.keys(map).length > 0 ? map : undefined,
      };
    }),
  };
}

/**
 * Upsert / clear Warm Path v2 feedback for the signed-in member.
 * Optimistically patches the investor detail query cache.
 */
export function useWarmPathV2Feedback(opts: {
  investorProfileUid: string | null | undefined;
  targetSet?: string | null;
}) {
  const queryClient = useQueryClient();
  const detailKey = [
    InvestorsQueryKeys.WARM_INTROS_V2_PATHS_FOR_INVESTOR,
    opts.investorProfileUid,
    opts.targetSet ?? null,
  ];

  const upsert = useMutation({
    mutationFn: ({ warmPathUid, body }: { warmPathUid: string; body: UpsertWarmPathFeedbackBody }) =>
      upsertWarmPathFeedback(warmPathUid, body),
    onMutate: async ({ warmPathUid, body }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WarmIntrosV2InvestorPathsResponse>(detailKey);
      const existing = previous?.paths.find((p) => p.uid === warmPathUid)?.myFeedbackByConnector?.[
        body.connectorProfileUid
      ];
      const next: WarmPathMyFeedback = {
        canRefer: Object.prototype.hasOwnProperty.call(body, 'canRefer')
          ? ((body.canRefer as WarmPathCanRefer | null) ?? null)
          : (existing?.canRefer ?? null),
        note: Object.prototype.hasOwnProperty.call(body, 'note') ? body.note?.trim() || null : (existing?.note ?? null),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData(detailKey, patchMyFeedback(previous, warmPathUid, body.connectorProfileUid, next));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(detailKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey });
      void queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.WARM_INTROS_V2_FEEDBACK_QUEUE] });
    },
  });

  const clearRefer = useMutation({
    mutationFn: ({ warmPathUid, connectorProfileUid }: { warmPathUid: string; connectorProfileUid: string }) =>
      clearWarmPathRefer(warmPathUid, connectorProfileUid),
    onMutate: async ({ warmPathUid, connectorProfileUid }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WarmIntrosV2InvestorPathsResponse>(detailKey);
      const existing = previous?.paths.find((p) => p.uid === warmPathUid)?.myFeedbackByConnector?.[connectorProfileUid];
      const next: WarmPathMyFeedback | null = existing?.note
        ? { canRefer: null, note: existing.note, updatedAt: new Date().toISOString() }
        : null;
      queryClient.setQueryData(detailKey, patchMyFeedback(previous, warmPathUid, connectorProfileUid, next));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(detailKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey });
      void queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.WARM_INTROS_V2_FEEDBACK_QUEUE] });
    },
  });

  return { upsert, clearRefer };
}
