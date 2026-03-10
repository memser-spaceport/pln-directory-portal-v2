import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/core/ToastContainer';
import { TeamsQueryKeys } from '@/services/teams/constants';
import { ITeam } from '@/types/teams.types';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';

type ReviewTeamEnrichmentMutationParams = {
  teamUid: string;
};

type MutationContext = {
  previousTeam?: ITeam | null;
};

async function mutation({ teamUid }: ReviewTeamEnrichmentMutationParams) {
  const { authToken } = getCookiesFromClient();

  if (!authToken) {
    throw new Error('Cannot get auth token');
  }

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/teams/${teamUid}/enrichment-review`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'Reviewed' }),
    },
    true,
  );

  if (!response?.ok) {
    let message = 'Failed to review team profile enrichment';

    try {
      const errorPayload = await response?.json();
      message = errorPayload?.message || errorPayload?.status?.message || message;
    } catch {
      // ignore response parsing errors
    }

    throw new Error(message);
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function useReviewTeamEnrichmentMutation() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, ReviewTeamEnrichmentMutationParams, MutationContext>({
    mutationFn: mutation,
    onMutate: async ({ teamUid }) => {
      await queryClient.cancelQueries({ queryKey: [TeamsQueryKeys.GET_TEAM, teamUid] });

      const previousTeam = queryClient.getQueryData<ITeam | null>([TeamsQueryKeys.GET_TEAM, teamUid]);

      queryClient.setQueryData<ITeam | null>([TeamsQueryKeys.GET_TEAM, teamUid], (currentTeam) => {
        if (!currentTeam) {
          return currentTeam;
        }

        return {
          ...currentTeam,
          dataEnrichment: {
            ...currentTeam.dataEnrichment,
            status: 'Reviewed',
          },
        };
      });

      return { previousTeam };
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData([TeamsQueryKeys.GET_TEAM, variables.teamUid], context.previousTeam ?? null);
      }

      toast.error(error.message || 'Failed to review team profile enrichment');
    },
    onSettled: (_data, _error, { teamUid }) => {
      queryClient.invalidateQueries({ queryKey: [TeamsQueryKeys.GET_TEAM, teamUid] });
      queryClient.invalidateQueries({ queryKey: [TeamsQueryKeys.GET_TEAMS_LIST] });
    },
  });
}