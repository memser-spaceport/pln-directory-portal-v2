'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savePinNote } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryItemListResponse, GantryPinner, GantryPinStatus } from '../types';

type PinNotePayload = { uid: string; note: string };

type NoteContext = {
  previousLists: [readonly unknown[], GantryItemListResponse | undefined][];
  previousItemPins: GantryPinner[] | undefined;
};

export function useGantryPinNote() {
  const queryClient = useQueryClient();

  return useMutation<{ item: unknown; balance: unknown }, Error, PinNotePayload, NoteContext>({
    mutationFn: ({ uid, note }: PinNotePayload) => savePinNote(uid, note),

    onMutate: async ({ uid: itemUid, note }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEM_PINS, itemUid] }),
      ]);

      const previousLists = queryClient.getQueriesData<GantryItemListResponse>({
        queryKey: [GantryQueryKeys.ITEMS],
      });

      // Find the current viewer's pinner uid via PIN_STATUS so we can update ITEM_PINS.
      const pinStatus = queryClient.getQueryData<GantryPinStatus>([GantryQueryKeys.PIN_STATUS]);
      const pinUid = pinStatus?.pins.find((p) => p.item.uid === itemUid)?.uid;
      const previousItemPins = queryClient.getQueryData<GantryPinner[]>([GantryQueryKeys.ITEM_PINS, itemUid]);

      // Update viewerPinNote in ITEMS list cache.
      queryClient.setQueriesData<GantryItemListResponse>(
        { queryKey: [GantryQueryKeys.ITEMS] },
        (old) =>
          old && {
            ...old,
            items: old.items.map((it) => (it.uid === itemUid ? { ...it, viewerPinNote: note } : it)),
          },
      );

      // Update note in the curator ITEM_PINS cache (matched by pinner uid).
      if (pinUid && previousItemPins) {
        queryClient.setQueryData<GantryPinner[]>(
          [GantryQueryKeys.ITEM_PINS, itemUid],
          previousItemPins.map((p) => (p.uid === pinUid ? { ...p, note } : p)),
        );
      }

      return { previousLists, previousItemPins };
    },

    onError: (_e, { uid: itemUid }, context) => {
      if (!context) return;
      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }
      if (context.previousItemPins !== undefined) {
        queryClient.setQueryData([GantryQueryKeys.ITEM_PINS, itemUid], context.previousItemPins);
      }
    },

    onSettled: (_r, _e, { uid }) => {
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, uid] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM_PINS, uid] });
    },
  });
}
