import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
// import { getAnalyticsTeamInfo } from '@/utils/common.utils';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { ITeam } from '@/types/teams.types';
import { getAnalyticsTeamInfo } from '@/utils/common.utils';
import { TeamsQueryKeys } from '@/services/teams/constants';
import { toast } from '@/components/core/ToastContainer';

type CloseAskMutationParams = {
  teamId: string;
  teamName: string;
  uid: string;
  status: string;
  closedReason?: string;
  closedComment?: string;
  closedByUid?: string;
};

async function mutation({ teamId, uid, teamName, status, closedByUid, closedReason, closedComment }: CloseAskMutationParams) {
  const { authToken } = getCookiesFromClient();
  const url = `${process.env.DIRECTORY_API_URL}/v1/asks/${uid}/close`;
  const payload = {
    closedReason,
    closedComment,
    closedByUid,
  };

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
    toast.success('Ask closed successfully');

    return await response.json();
  } else {
    toast.error('Something went wrong!');
    return null;
  }
}

export function useCloseAskMutation(team: ITeam) {
  const analytics = useTeamAnalytics();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: [TeamsQueryKeys.GET_ASKS],
      });
      analytics.teamDetailUpdateAskClicked(getAnalyticsTeamInfo(team), res);
    },
  });
}
