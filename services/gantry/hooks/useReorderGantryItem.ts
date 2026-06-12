'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGantryItem } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryItemListResponse } from '../types';

export function useReorderGantryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, order }: { uid: string; order: number }) => updateGantryItem(uid, { order }),
    onMutate: async ({ uid, order }) => {
      await queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEMS] });
      queryClient.setQueriesData<GantryItemListResponse>({ queryKey: [GantryQueryKeys.ITEMS] }, (old) => {
        if (!old) return old;
        return { ...old, items: old.items.map((item) => (item.uid === uid ? { ...item, order } : item)) };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
    },
  });
}
