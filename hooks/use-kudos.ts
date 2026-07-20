/**
 * Community Kudos (Lite) hooks — TanStack Query wrappers around
 * `@/services/kudos.service`.
 *
 * After a successful submit, the feed and community-pool queries are invalidated
 * so the page updates without a manual refresh.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getKudosFeed,
  getCommunityPool,
  getRecipients,
  submitCommunityKudos,
  type IGetKudosFeedParams,
} from '@/services/kudos.service';
import type { ICommunityKudosInput } from '@/components/page/aligement-assets/kudos-board/data/kudos-board.types';

export const kudosKeys = {
  all: ['kudos'] as const,
  feed: (params: IGetKudosFeedParams) => ['kudos', 'feed', params] as const,
  pool: (roundId: string) => ['kudos', 'pool', roundId] as const,
  recipients: () => ['kudos', 'recipients'] as const,
};

/* --------------------------------------------------------------------------
   Queries
   -------------------------------------------------------------------------- */

export function useKudosFeed(params: IGetKudosFeedParams) {
  return useQuery({
    queryKey: kudosKeys.feed(params),
    queryFn: () => getKudosFeed(params),
    enabled: Boolean(params.roundId),
  });
}

export function useCommunityPool(roundId: string | undefined) {
  return useQuery({
    queryKey: kudosKeys.pool(roundId ?? ''),
    queryFn: () => getCommunityPool(roundId as string),
    enabled: Boolean(roundId),
  });
}

/** Recipient directory for the picker — fetched at runtime, never bundled. */
export function useRecipients() {
  return useQuery({
    queryKey: kudosKeys.recipients(),
    queryFn: () => getRecipients(),
    staleTime: 5 * 60 * 1000, // 5 min — the active member list changes rarely
  });
}

/* --------------------------------------------------------------------------
   Mutation
   -------------------------------------------------------------------------- */

/**
 * Give a community kudos. On success invalidates the feed and pool queries so
 * the UI reflects the new state immediately.
 */
export function useGiveCommunityKudos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ICommunityKudosInput) => submitCommunityKudos(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kudos', 'feed'] });
      qc.invalidateQueries({ queryKey: ['kudos', 'pool'] });
    },
  });
}
