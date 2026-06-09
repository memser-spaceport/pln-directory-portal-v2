'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addGantryUpvote, removeGantryUpvote } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryItem, GantryItemListResponse } from '../types';

type UpvotePayload = {
  uid: string;
  nextHasUpvoted: boolean;
};

function applyUpvote(item: GantryItem, uid: string, nextHasUpvoted: boolean): GantryItem {
  if (item.uid !== uid) return item;
  return {
    ...item,
    viewerHasUpvoted: nextHasUpvoted,
    upvoteCount: item.upvoteCount + (nextHasUpvoted ? 1 : -1),
  };
}

export function useGantryUpvote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, nextHasUpvoted }: UpvotePayload) =>
      nextHasUpvoted ? addGantryUpvote(uid) : removeGantryUpvote(uid),

    onMutate: async ({ uid, nextHasUpvoted }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEM, uid] }),
      ]);

      const previousLists = queryClient.getQueriesData<GantryItemListResponse>({
        queryKey: [GantryQueryKeys.ITEMS],
      });
      const previousItem = queryClient.getQueryData<GantryItem | null>([GantryQueryKeys.ITEM, uid]);

      queryClient.setQueriesData<GantryItemListResponse>(
        { queryKey: [GantryQueryKeys.ITEMS] },
        (old) => old && { ...old, items: old.items.map((it) => applyUpvote(it, uid, nextHasUpvoted)) },
      );

      if (previousItem) {
        queryClient.setQueryData<GantryItem>([GantryQueryKeys.ITEM, uid], applyUpvote(previousItem, uid, nextHasUpvoted));
      }

      return { previousLists, previousItem };
    },

    onError: (_err, { uid }, context) => {
      if (context?.previousLists) {
        for (const [queryKey, data] of context.previousLists) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousItem !== undefined) {
        queryClient.setQueryData([GantryQueryKeys.ITEM, uid], context.previousItem);
      }
    },

    onSettled: (_result, _err, { uid }) => {
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, uid] });
    },
  });
}
