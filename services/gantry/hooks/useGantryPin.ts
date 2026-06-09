'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addGantryPin, removeGantryPin } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryItem, GantryItemListResponse, GantryPinStatus } from '../types';

// TODO: set to false when POST/DELETE /v1/roadmap/items/:uid/pin is live
const USE_MOCK = true;

type PinPayload = { uid: string; nextIsPinned: boolean };

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

async function pinMutationFn({ uid, nextIsPinned }: PinPayload): Promise<void> {
  if (USE_MOCK) return; // optimistic cache update in onMutate is the only state change
  if (nextIsPinned) await addGantryPin(uid);
  else await removeGantryPin(uid);
}

export function useGantryPin() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, PinPayload, PinContext>({
    mutationFn: pinMutationFn,

    onMutate: async ({ uid, nextIsPinned }) => {
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
        (old) => old && { ...old, items: old.items.map((it) => applyPin(it, uid, nextIsPinned)) },
      );

      if (previousItem) {
        queryClient.setQueryData<GantryItem>([GantryQueryKeys.ITEM, uid], applyPin(previousItem, uid, nextIsPinned));
      }

      if (previousPinStatus) {
        queryClient.setQueryData<GantryPinStatus>([GantryQueryKeys.PIN_STATUS], {
          ...previousPinStatus,
          used: previousPinStatus.used + (nextIsPinned ? 1 : -1),
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

    onSettled: USE_MOCK
      ? undefined
      : (_result, _err, { uid }) => {
          queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
          queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, uid] });
          queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.PIN_STATUS] });
        },
  });
}
