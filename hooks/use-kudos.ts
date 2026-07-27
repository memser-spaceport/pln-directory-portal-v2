import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
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

// Every kudos endpoint is authenticated, so each query is gated on the session
// token: without it a signed-out visitor fires three requests that can only 401.
function useIsAuthenticated() {
  return Boolean(getCookiesFromClient()?.authToken);
}

export function useKudosFeed(params: IGetKudosFeedParams) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: kudosKeys.feed(params),
    queryFn: () => getKudosFeed(params),
    enabled: isAuthenticated && Boolean(params.roundId),
  });
}

export function useCommunityPool(roundId: string | undefined) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: kudosKeys.pool(roundId ?? ''),
    queryFn: () => getCommunityPool(roundId as string),
    enabled: isAuthenticated && Boolean(roundId),
  });
}

export function useRecipients() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: kudosKeys.recipients(),
    queryFn: () => getRecipients(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

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
