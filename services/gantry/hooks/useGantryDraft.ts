'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteGantryDraft,
  readGantryDraftResult,
  writeGantryDraft,
} from '@/utils/gantryDraftStorage';
import { GantryQueryKeys } from '../constants';
import type { SubmitIdeaModalVariant } from '../submitIdeaModal';
import type { SubmitIdeaDraft } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

export type GantryDraftQueryResult = {
  data: SubmitIdeaDraft;
  savedAt: number;
} | null;

export function useGantryDraftQuery(variant: SubmitIdeaModalVariant) {
  return useQuery<GantryDraftQueryResult>({
    queryKey: [GantryQueryKeys.DRAFT, variant],
    queryFn: () => readGantryDraftResult(variant),
    staleTime: Infinity,
  });
}

export function useGantrySaveDraftMutation(variant: SubmitIdeaModalVariant) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: SubmitIdeaDraft) => writeGantryDraft(variant, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.DRAFT, variant] });
    },
  });
}

export function useGantryDiscardDraftMutation(variant: SubmitIdeaModalVariant) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteGantryDraft(variant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GantryQueryKeys.DRAFT, variant] });
    },
  });
}
