'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { declineGantryItem, promoteGantryItem, transitionGantryItem } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryStage } from '../types';

type TransitionPayload =
  | { type: 'promote' }
  | { type: 'decline'; reason: string }
  | { type: 'transition'; stage: GantryStage };

type TransitionMutationPayload = {
  uid: string;
  payload: TransitionPayload;
};

export function useGantryTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, payload }: TransitionMutationPayload) => {
      if (payload.type === 'promote') return promoteGantryItem(uid);
      if (payload.type === 'decline') return declineGantryItem(uid, payload.reason);
      return transitionGantryItem(uid, payload.stage);
    },
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] }),
        queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEM, variables.uid] }),
      ]);
    },
  });
}
