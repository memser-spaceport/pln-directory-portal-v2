'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGantryItem } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { UpdateGantryItemPayload } from '../types';

export function useUpdateGantryItem(uid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateGantryItemPayload) => updateGantryItem(uid, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, uid] }),
      ]);
    },
  });
}
