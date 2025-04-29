import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from 'react-toastify';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { ITeam, ITeamAsk } from '@/types/teams.types';
import { getAnalyticsTeamInfo } from '@/utils/common.utils';
import { TeamsQueryKeys } from '@/services/teams/constants';

type DeleteAskMutationParams = {
  teamId: string;
  teamName: string;
  ask: ITeamAsk;
};

async function mutation({ teamId, ask, teamName }: DeleteAskMutationParams) {
  const { authToken } = getCookiesFromClient();
  const url = `${process.env.DIRECTORY_API_URL}/v1/teams/${teamId}/ask`;
  const payload = { ask: { ...ask, isDeleted: true }, teamName };

  const response = await customFetch(
    url,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    },
    true,
  );

  if (response?.ok) {
    toast.success('Ask deleted successfully');

    return await response.json();
  } else {
    toast.error('Something went wrong!');
    return null;
  }
}

export function useDeleteAskMutation(team: ITeam) {
  const analytics = useTeamAnalytics();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: [TeamsQueryKeys.GET_ASKS],
      });
      analytics.teamDetailDeleteAskClicked(getAnalyticsTeamInfo(team), res);
    },
  });
}
