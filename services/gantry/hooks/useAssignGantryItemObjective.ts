'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignGantryItemObjective } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { AssignObjectiveBody } from '../gantry.service';
import type { GantryItem, GantryItemListResponse, GantryObjective } from '../types';

type Context = {
  previousLists: [readonly unknown[], GantryItemListResponse | undefined][];
  previousItem: GantryItem | null | undefined;
};

export function useAssignGantryItemObjective(uid: string) {
  const queryClient = useQueryClient();

  return useMutation<GantryItem, Error, AssignObjectiveBody, Context>({
    mutationFn: (body) => assignGantryItemObjective(uid, body),

    onMutate: async (body) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEM, uid] }),
      ]);

      const previousLists = queryClient.getQueriesData<GantryItemListResponse>({
        queryKey: [GantryQueryKeys.ITEMS],
      });
      const previousItem = queryClient.getQueryData<GantryItem | null>([GantryQueryKeys.ITEM, uid]);

      // Optimistic update only for assign/clear — for create, uid/code are unknown until server responds.
      if ('objectiveUid' in body) {
        const nextObjective =
          body.objectiveUid === null
            ? null
            : (queryClient
                .getQueryData<GantryObjective[]>([GantryQueryKeys.OBJECTIVES])
                ?.find((o) => o.uid === body.objectiveUid) ?? null);

        const applyObjective = (item: GantryItem): GantryItem => {
          if (item.uid !== uid) return item;
          return {
            ...item,
            objective: nextObjective ? { uid: nextObjective.uid, order: nextObjective.order, title: nextObjective.title } : null,
          };
        };

        queryClient.setQueriesData<GantryItemListResponse>(
          { queryKey: [GantryQueryKeys.ITEMS] },
          (old) => old && { ...old, items: old.items.map(applyObjective) },
        );

        if (previousItem) {
          queryClient.setQueryData<GantryItem>([GantryQueryKeys.ITEM, uid], applyObjective(previousItem));
        }
      }

      return { previousLists, previousItem };
    },

    onError: (_e, _v, context) => {
      if (!context) return;
      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }
      if (context.previousItem !== undefined) {
        queryClient.setQueryData([GantryQueryKeys.ITEM, uid], context.previousItem);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, uid] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.OBJECTIVES] });
    },
  });
}
