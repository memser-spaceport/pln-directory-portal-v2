'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addGantryPin, removeGantryPin } from '../gantry.service';
import { GantryQueryKeys } from '../constants';

type PinPayload = { uid: string; nextIsPinned: boolean };

export function useGantryPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, nextIsPinned }: PinPayload) =>
      nextIsPinned ? addGantryPin(uid) : removeGantryPin(uid),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, variables.uid] }),
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.PIN_STATUS] }),
      ]);
    },
  });
}
