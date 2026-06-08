'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { declineGantryItem, promoteGantryItem, transitionGantryItem } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryItemListResponse, GantryStage } from '../types';

type TransitionPayload =
  | { type: 'promote' }
  | { type: 'decline'; reason: string }
  | { type: 'transition'; stage: GantryStage };

type TransitionMutationPayload = {
  uid: string;
  payload: TransitionPayload;
};

function resolveTargetStage(payload: TransitionPayload): GantryStage {
  if (payload.type === 'promote') return 'PLANNED';
  if (payload.type === 'decline') return 'DECLINED';
  return payload.stage;
}

export function useGantryTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, payload }: TransitionMutationPayload) => {
      if (payload.type === 'promote') return promoteGantryItem(uid);
      if (payload.type === 'decline') return declineGantryItem(uid, payload.reason);
      return transitionGantryItem(uid, payload.stage);
    },
    onMutate: async ({ uid, payload }) => {
      await queryClient.cancelQueries({ queryKey: [GantryQueryKeys.ITEMS] });
      const targetStage = resolveTargetStage(payload);
      const snapshot = queryClient.getQueriesData<GantryItemListResponse>({ queryKey: [GantryQueryKeys.ITEMS] });
      queryClient.setQueriesData<GantryItemListResponse>({ queryKey: [GantryQueryKeys.ITEMS] }, (old) => {
        if (!old) return old;
        return { ...old, items: old.items.map((item) => (item.uid === uid ? { ...item, stage: targetStage } : item)) };
      });
      return { snapshot };
    },
    onError: (_err, _variables, context) => {
      context?.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: (_result, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, variables.uid] });
    },
  });
}
