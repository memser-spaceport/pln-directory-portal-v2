'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addGantryUpvote, removeGantryUpvote } from '../gantry.service';
import { GantryQueryKeys } from '../constants';

type UpvotePayload = {
  uid: string;
  nextHasUpvoted: boolean;
};

export function useGantryUpvote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, nextHasUpvoted }: UpvotePayload) => {
      if (nextHasUpvoted) {
        return addGantryUpvote(uid);
      }
      return removeGantryUpvote(uid);
    },
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, variables.uid] }),
      ]);
    },
  });
}
