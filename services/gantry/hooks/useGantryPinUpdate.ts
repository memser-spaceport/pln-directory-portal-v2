'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGantryPin } from '../gantry.service';
import { GantryQueryKeys, GANTRY_ITEM_WRITE_MUTATION_KEY, GANTRY_ITEM_WRITE_SCOPE } from '../constants';
import { applyImpactChange } from '../impact';
import type {
  GantryItem,
  GantryItemListResponse,
  GantryPinner,
  GantryPinStatus,
  UpdateGantryPinPayload,
} from '../types';

type PinUpdatePayload = { uid: string } & UpdateGantryPinPayload;

type PinUpdateContext = {
  previousLists: [readonly unknown[], GantryItemListResponse | undefined][];
  previousItem: GantryItem | null | undefined;
  previousItemPins: GantryPinner[] | undefined;
};

function applyPinUpdateToItem(item: GantryItem, payload: PinUpdatePayload): GantryItem {
  const next = { ...item };
  if (payload.impact !== undefined) {
    Object.assign(next, applyImpactChange(item, { prev: item.viewerImpact, next: payload.impact }));
    next.viewerImpact = payload.impact;
  }
  if (payload.note !== undefined) next.viewerPinNote = payload.note;
  return next;
}

/**
 * PATCH the viewer's active pin — rating and/or note ("Your rating" row edits, and the
 * legacy note-only save when the impact UI is off). Shares the write scope with useGantryPin
 * so the two mutations never interleave optimistic snapshots on the same caches.
 */
export function useGantryPinUpdate() {
  const queryClient = useQueryClient();

  return useMutation<{ item: GantryItem; balance: unknown }, Error, PinUpdatePayload, PinUpdateContext>({
    mutationFn: ({ uid, impact, note }) => updateGantryPin(uid, { impact, note }),
    mutationKey: [...GANTRY_ITEM_WRITE_MUTATION_KEY],
    scope: GANTRY_ITEM_WRITE_SCOPE,

    onMutate: async (payload) => {
      const { uid } = payload;
      await Promise.all([
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEM, uid] }),
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEM_PINS, uid] }),
      ]);

      const previousLists = queryClient.getQueriesData<GantryItemListResponse>({
        queryKey: [GantryQueryKeys.ITEMS],
      });
      const previousItem = queryClient.getQueryData<GantryItem | null>([GantryQueryKeys.ITEM, uid]);
      const previousItemPins = queryClient.getQueryData<GantryPinner[]>([GantryQueryKeys.ITEM_PINS, uid]);

      queryClient.setQueriesData<GantryItemListResponse>(
        { queryKey: [GantryQueryKeys.ITEMS] },
        (old) =>
          old && {
            ...old,
            items: old.items.map((it) => (it.uid === uid ? applyPinUpdateToItem(it, payload) : it)),
          },
      );

      if (previousItem) {
        queryClient.setQueryData<GantryItem>([GantryQueryKeys.ITEM, uid], applyPinUpdateToItem(previousItem, payload));
      }

      // Patch the viewer's row in the curator ITEM_PINS cache (matched by pinner uid via PIN_STATUS).
      const pinStatus = queryClient.getQueryData<GantryPinStatus>([GantryQueryKeys.PIN_STATUS]);
      const pinUid = pinStatus?.pins.find((p) => p.item.uid === uid)?.uid;
      if (pinUid && previousItemPins) {
        queryClient.setQueryData<GantryPinner[]>(
          [GantryQueryKeys.ITEM_PINS, uid],
          previousItemPins.map((p) =>
            p.uid === pinUid
              ? {
                  ...p,
                  ...(payload.impact !== undefined ? { impact: payload.impact } : null),
                  ...(payload.note !== undefined ? { note: payload.note } : null),
                }
              : p,
          ),
        );
      }

      return { previousLists, previousItem, previousItemPins };
    },

    onError: (_err, { uid }, context) => {
      if (!context) return;
      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }
      if (context.previousItem !== undefined) {
        queryClient.setQueryData([GantryQueryKeys.ITEM, uid], context.previousItem);
      }
      if (context.previousItemPins !== undefined) {
        queryClient.setQueryData([GantryQueryKeys.ITEM_PINS, uid], context.previousItemPins);
      }
    },

    onSettled: (_result, _err, { uid }) => {
      // Last-standing writer only — see GANTRY_ITEM_WRITE_MUTATION_KEY.
      if (queryClient.isMutating({ mutationKey: [...GANTRY_ITEM_WRITE_MUTATION_KEY] }) !== 1) return;
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, uid] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM_PINS, uid] });
    },
  });
}
