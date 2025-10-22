import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer';
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
  const url = `${process.env.DIRECTORY_API_URL}/v1/asks/${ask.uid}`;

  const response = await customFetch(
    url,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    },
    true,
  );

  if (response?.ok) {
    toast.success('Ask deleted successfully');
    return true;
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
