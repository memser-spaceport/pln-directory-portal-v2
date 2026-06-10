'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savePinNote } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryItemListResponse } from '../types';

type PinNotePayload = { uid: string; note: string };

export function useGantryPinNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, note }: PinNotePayload) => savePinNote(uid, note),

    onMutate: ({ uid, note }) => {
      queryClient.setQueriesData<GantryItemListResponse>(
        { queryKey: [GantryQueryKeys.ITEMS] },
        (old) =>
          old && {
            ...old,
            items: old.items.map((it) => (it.uid === uid ? { ...it, viewerPinNote: note } : it)),
          },
      );
    },

    onSettled: (_r, _e, { uid }) => {
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, uid] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM_PINS, uid] });
    },
  });
}
