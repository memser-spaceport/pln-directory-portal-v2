'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addGantryPin, removeGantryPin, PinBalanceExhaustedError } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryItem, GantryItemListResponse, GantryPinBalance, GantryPinStatus } from '../types';

type PinPayload = { uid: string; nextIsPinned: boolean; swapItemUid?: string | null };

type PinResult = { item: GantryItem; balance: GantryPinBalance };

type PinContext = {
  previousLists: [readonly unknown[], GantryItemListResponse | undefined][];
  previousItem: GantryItem | null | undefined;
  previousPinStatus: GantryPinStatus | undefined;
};

function applyPin(item: GantryItem, uid: string, nextIsPinned: boolean): GantryItem {
  if (item.uid !== uid) return item;
  return {
    ...item,
    viewerHasPinned: nextIsPinned,
    pinCount: (item.pinCount ?? 0) + (nextIsPinned ? 1 : -1),
  };
}

async function pinMutationFn({ uid, nextIsPinned, swapItemUid }: PinPayload): Promise<PinResult> {
  if (nextIsPinned) {
    const result = await addGantryPin(uid, { swapItemUid: swapItemUid ?? null });
    if (!result.ok) {
      if (result.error === 'PIN_BALANCE_EXHAUSTED') throw new PinBalanceExhaustedError();
      throw new Error('Failed to pin item');
    }
    return { item: result.item, balance: result.balance };
  }
  return removeGantryPin(uid);
}

export function useGantryPin() {
  const queryClient = useQueryClient();

  return useMutation<PinResult, Error, PinPayload, PinContext>({
    mutationFn: pinMutationFn,

    onMutate: async ({ uid, nextIsPinned, swapItemUid }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEM, uid] }),
      ]);

      const previousLists = queryClient.getQueriesData<GantryItemListResponse>({
        queryKey: [GantryQueryKeys.ITEMS],
      });
      const previousItem = queryClient.getQueryData<GantryItem | null>([GantryQueryKeys.ITEM, uid]);
      const previousPinStatus = queryClient.getQueryData<GantryPinStatus>([GantryQueryKeys.PIN_STATUS]);

      queryClient.setQueriesData<GantryItemListResponse>(
        { queryKey: [GantryQueryKeys.ITEMS] },
        (old) =>
          old && {
            ...old,
            items: old.items.map((it) => {
              if (it.uid === uid) return applyPin(it, uid, nextIsPinned);
              if (swapItemUid && nextIsPinned && it.uid === swapItemUid) return applyPin(it, swapItemUid, false);
              return it;
            }),
          },
      );

      if (previousItem) {
        queryClient.setQueryData<GantryItem>([GantryQueryKeys.ITEM, uid], applyPin(previousItem, uid, nextIsPinned));
      }

      if (previousPinStatus) {
        const balanceDelta = swapItemUid && nextIsPinned ? 0 : nextIsPinned ? 1 : -1;
        queryClient.setQueryData<GantryPinStatus>([GantryQueryKeys.PIN_STATUS], {
          ...previousPinStatus,
          used: previousPinStatus.used + balanceDelta,
          remaining: previousPinStatus.remaining - balanceDelta,
        });
      }

      return { previousLists, previousItem, previousPinStatus };
    },

    onError: (_err, { uid }, context) => {
      if (!context) return;
      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }
      if (context.previousItem !== undefined) {
        queryClient.setQueryData([GantryQueryKeys.ITEM, uid], context.previousItem);
      }
      if (context.previousPinStatus !== undefined) {
        queryClient.setQueryData([GantryQueryKeys.PIN_STATUS], context.previousPinStatus);
      }
    },

    onSettled: (_result, _err, { uid, swapItemUid }) => {
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, uid] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.PIN_STATUS] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM_PINS, uid] });
      if (swapItemUid) {
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM_PINS, swapItemUid] });
      }
    },
  });
}
