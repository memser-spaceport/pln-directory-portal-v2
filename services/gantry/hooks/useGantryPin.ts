'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addGantryPin, removeGantryPin, PinBalanceExhaustedError } from '../gantry.service';
import { GantryQueryKeys, GANTRY_ITEM_WRITE_MUTATION_KEY, GANTRY_ITEM_WRITE_SCOPE } from '../constants';
import { applyImpactChange } from '../impact';
import type {
  GantryImpactValue,
  GantryItem,
  GantryItemListResponse,
  GantryObjectiveImpacts,
  GantryPinBalance,
  GantryPinStatus,
} from '../types';

/**
 * Unpin never carries a rating. The pinned arm's `impact` is optional only because the
 * flag-off legacy flow shares it — useRoadmapPinActions enforces presence when the impact
 * UI is enabled ("boosting IS rating").
 */
type PinPayload =
  | { uid: string; nextIsPinned: false }
  | {
      uid: string;
      nextIsPinned: true;
      impact?: GantryImpactValue;
      note?: string;
      objectiveImpacts?: GantryObjectiveImpacts;
      swapItemUid?: string | null;
    };

type PinResult = { item: GantryItem; balance: GantryPinBalance };

type PinContext = {
  previousLists: [readonly unknown[], GantryItemListResponse | undefined][];
  previousItem: GantryItem | null | undefined;
  previousSwapItem: GantryItem | null | undefined;
  previousPinStatus: GantryPinStatus | undefined;
};

/**
 * Pin/unpin an item and move the viewer's rating with the pin: boosting adds `impact` to the
 * aggregate, unpinning (or being the released side of a swap) removes the viewer's pin rating.
 * `authorImpact` is item-level and untouched by construction.
 */
function applyPinToItem(
  item: GantryItem,
  nextIsPinned: boolean,
  impact: GantryImpactValue | null,
  note: string | null,
): GantryItem {
  const nextViewerImpact = nextIsPinned ? (impact ?? item.viewerImpact) : null;
  const aggregate = applyImpactChange(item, { prev: item.viewerImpact, next: nextViewerImpact });
  return {
    ...item,
    ...aggregate,
    viewerHasPinned: nextIsPinned,
    pinCount: (item.pinCount ?? 0) + (nextIsPinned ? 1 : -1),
    viewerImpact: nextViewerImpact,
    viewerPinNote: nextIsPinned ? (note ?? item.viewerPinNote) : null,
  };
}

async function pinMutationFn(payload: PinPayload): Promise<PinResult> {
  if (payload.nextIsPinned) {
    const result = await addGantryPin(payload.uid, {
      swapItemUid: payload.swapItemUid ?? null,
      note: payload.note ?? null,
      impact: payload.impact,
      objectiveImpacts: payload.objectiveImpacts,
    });
    if (!result.ok) {
      if (result.error === 'PIN_BALANCE_EXHAUSTED') throw new PinBalanceExhaustedError();
      throw new Error('Failed to pin item');
    }
    return { item: result.item, balance: result.balance };
  }
  return removeGantryPin(payload.uid);
}

export function useGantryPin() {
  const queryClient = useQueryClient();

  return useMutation<PinResult, Error, PinPayload, PinContext>({
    mutationFn: pinMutationFn,
    mutationKey: [...GANTRY_ITEM_WRITE_MUTATION_KEY],
    scope: GANTRY_ITEM_WRITE_SCOPE,

    onMutate: async (payload) => {
      const { uid, nextIsPinned } = payload;
      const swapItemUid = payload.nextIsPinned ? (payload.swapItemUid ?? null) : null;
      const impact = payload.nextIsPinned ? (payload.impact ?? null) : null;
      const note = payload.nextIsPinned ? (payload.note ?? null) : null;

      await Promise.all([
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEM, uid] }),
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.PIN_STATUS] }),
        ...(swapItemUid ? [queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEM, swapItemUid] })] : []),
      ]);

      const previousLists = queryClient.getQueriesData<GantryItemListResponse>({
        queryKey: [GantryQueryKeys.ITEMS],
      });
      const previousItem = queryClient.getQueryData<GantryItem | null>([GantryQueryKeys.ITEM, uid]);
      const previousSwapItem = swapItemUid
        ? queryClient.getQueryData<GantryItem | null>([GantryQueryKeys.ITEM, swapItemUid])
        : undefined;
      const previousPinStatus = queryClient.getQueryData<GantryPinStatus>([GantryQueryKeys.PIN_STATUS]);

      queryClient.setQueriesData<GantryItemListResponse>(
        { queryKey: [GantryQueryKeys.ITEMS] },
        (old) =>
          old && {
            ...old,
            items: old.items.map((it) => {
              if (it.uid === uid) return applyPinToItem(it, nextIsPinned, impact, note);
              if (swapItemUid && it.uid === swapItemUid) return applyPinToItem(it, false, null, null);
              return it;
            }),
          },
      );

      if (previousItem) {
        queryClient.setQueryData<GantryItem>(
          [GantryQueryKeys.ITEM, uid],
          applyPinToItem(previousItem, nextIsPinned, impact, note),
        );
      }
      if (swapItemUid && previousSwapItem) {
        queryClient.setQueryData<GantryItem>(
          [GantryQueryKeys.ITEM, swapItemUid],
          applyPinToItem(previousSwapItem, false, null, null),
        );
      }

      if (previousPinStatus) {
        const balanceDelta = swapItemUid && nextIsPinned ? 0 : nextIsPinned ? 1 : -1;
        queryClient.setQueryData<GantryPinStatus>([GantryQueryKeys.PIN_STATUS], {
          ...previousPinStatus,
          used: previousPinStatus.used + balanceDelta,
          remaining: previousPinStatus.remaining - balanceDelta,
        });
      }

      return { previousLists, previousItem, previousSwapItem, previousPinStatus };
    },

    onError: (_err, payload, context) => {
      if (!context) return;
      const swapItemUid = payload.nextIsPinned ? (payload.swapItemUid ?? null) : null;
      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }
      if (context.previousItem !== undefined) {
        queryClient.setQueryData([GantryQueryKeys.ITEM, payload.uid], context.previousItem);
      }
      if (swapItemUid && context.previousSwapItem !== undefined) {
        queryClient.setQueryData([GantryQueryKeys.ITEM, swapItemUid], context.previousSwapItem);
      }
      if (context.previousPinStatus !== undefined) {
        queryClient.setQueryData([GantryQueryKeys.PIN_STATUS], context.previousPinStatus);
      }
    },

    onSettled: (_result, _err, payload) => {
      // Invalidate only as the last-standing writer — a refetch fired here would clobber the
      // optimistic state of any still-pending pin/rating mutation on the same caches.
      if (queryClient.isMutating({ mutationKey: [...GANTRY_ITEM_WRITE_MUTATION_KEY] }) !== 1) return;
      const swapItemUid = payload.nextIsPinned ? (payload.swapItemUid ?? null) : null;
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, payload.uid] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.PIN_STATUS] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM_PINS, payload.uid] });
      if (swapItemUid) {
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, swapItemUid] });
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM_PINS, swapItemUid] });
      }
    },
  });
}
