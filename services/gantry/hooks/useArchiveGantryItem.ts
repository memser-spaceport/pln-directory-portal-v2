'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveGantryItem } from '../gantry.service';
import { GantryQueryKeys } from '../constants';

export function useArchiveGantryItem(uid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deletionReason?: string) => archiveGantryItem(uid, deletionReason),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, uid] }),
      ]);
    },
  });
}
