import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from 'react-toastify';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { ITeam } from '@/types/teams.types';
import { getAnalyticsTeamInfo } from '@/utils/common.utils';
import { TeamsQueryKeys } from '@/services/teams/constants';

type CreateAskMutationParams = {
  teamId: string;
  teamName: string;
  title: string;
  description: string;
  tags: string[];
};

async function mutation({ teamId, teamName, title, description, tags }: CreateAskMutationParams) {
  const { authToken } = getCookiesFromClient();
  const url = `${process.env.DIRECTORY_API_URL}/v1/teams/${teamId}/ask`;
  const payload = { ask: { title, description, tags }, teamName };

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
    toast.success('Ask added successfully');

    return await response.json();
  } else {
    toast.error('Something went wrong!');
    return null;
  }
}

export function useCreateAskMutation(team: ITeam) {
  const analytics = useTeamAnalytics();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: [TeamsQueryKeys.GET_ASKS],
      });
      analytics.teamDetailSubmitAskClicked(getAnalyticsTeamInfo(team), res);
    },
  });
}
