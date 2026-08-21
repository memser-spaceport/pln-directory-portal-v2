'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InvestorsQueryKeys } from '../constants';
import { upsertWarmPathNote } from '../warm-intros-v2.service';
import type {
  UpsertWarmPathNoteBody,
  WarmIntrosV2InvestorPathsResponse,
  WarmPathMyNote,
} from '../warm-intros-v2.types';

function patchMyNote(
  prev: WarmIntrosV2InvestorPathsResponse | undefined,
  warmPathUid: string,
  connectorProfileUid: string,
  next: WarmPathMyNote | null,
): WarmIntrosV2InvestorPathsResponse | undefined {
  if (!prev) return prev;
  return {
    ...prev,
    paths: prev.paths.map((path) => {
      if (path.uid !== warmPathUid) return path;
      const map = { ...(path.myNoteByConnector ?? {}) };
      if (next == null) {
        delete map[connectorProfileUid];
      } else {
        map[connectorProfileUid] = next;
      }
      return {
        ...path,
        myNoteByConnector: Object.keys(map).length > 0 ? map : undefined,
      };
    }),
  };
}

/**
 * Upsert / clear Warm Path v2 notes for the signed-in member.
 * Optimistically patches the investor detail query cache.
 */
export function useWarmPathV2Note(opts: { investorProfileUid: string | null | undefined; targetSet?: string | null }) {
  const queryClient = useQueryClient();
  const detailKey = [
    InvestorsQueryKeys.WARM_INTROS_V2_PATHS_FOR_INVESTOR,
    opts.investorProfileUid,
    opts.targetSet ?? null,
  ];

  const upsert = useMutation({
    mutationFn: ({ warmPathUid, body }: { warmPathUid: string; body: UpsertWarmPathNoteBody }) =>
      upsertWarmPathNote(warmPathUid, body),
    onMutate: async ({ warmPathUid, body }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WarmIntrosV2InvestorPathsResponse>(detailKey);
      const trimmed = body.note?.trim() || null;
      const next: WarmPathMyNote | null = trimmed ? { note: trimmed, updatedAt: new Date().toISOString() } : null;
      queryClient.setQueryData(detailKey, patchMyNote(previous, warmPathUid, body.connectorProfileUid, next));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(detailKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });

  return { upsert };
}
