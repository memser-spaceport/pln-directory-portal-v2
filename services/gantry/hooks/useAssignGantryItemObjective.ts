'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignGantryItemObjectives } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { AssignObjectivesBody } from '../gantry.service';
import type { GantryItem, GantryItemListResponse, GantryObjective } from '../types';

type Context = {
  previousLists: [readonly unknown[], GantryItemListResponse | undefined][];
  previousItem: GantryItem | null | undefined;
};

export function useAssignGantryItemObjectives(uid: string) {
  const queryClient = useQueryClient();

  return useMutation<GantryItem, Error, AssignObjectivesBody, Context>({
    mutationFn: (body) => assignGantryItemObjectives(uid, body),

    onMutate: async (body) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEM, uid] }),
      ]);

      const previousLists = queryClient.getQueriesData<GantryItemListResponse>({
        queryKey: [GantryQueryKeys.ITEMS],
      });
      const previousItem = queryClient.getQueryData<GantryItem | null>([GantryQueryKeys.ITEM, uid]);

      // Optimistic update only when no titles to create — new uids/orders are unknown until server responds.
      if (!body.titles?.length) {
        const catalog = queryClient.getQueryData<GantryObjective[]>([GantryQueryKeys.OBJECTIVES]) ?? [];
        const byUid = new Map(catalog.map((o) => [o.uid, o]));
        const nextObjectives = body.objectiveUids
          .map((id) => byUid.get(id))
          .filter((o): o is GantryObjective => !!o)
          .sort((a, b) => a.order - b.order)
          .map((o) => ({ uid: o.uid, order: o.order, title: o.title }));

        const applyObjectives = (item: GantryItem): GantryItem => {
          if (item.uid !== uid) return item;
          return { ...item, objectives: nextObjectives };
        };

        queryClient.setQueriesData<GantryItemListResponse>(
          { queryKey: [GantryQueryKeys.ITEMS] },
          (old) => old && { ...old, items: old.items.map(applyObjectives) },
        );

        if (previousItem) {
          queryClient.setQueryData<GantryItem>([GantryQueryKeys.ITEM, uid], applyObjectives(previousItem));
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
