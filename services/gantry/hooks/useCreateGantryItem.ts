'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGantryItem } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { CreateGantryItemPayload } from '../types';

export function useCreateGantryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGantryItemPayload) => createGantryItem(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.ITEMS] });
    },
  });
}
