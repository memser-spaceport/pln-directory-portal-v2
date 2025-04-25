import { useMutation } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
// import { getAnalyticsTeamInfo } from '@/utils/common.utils';
import { toast } from 'react-toastify';
import { useTeamAnalytics } from '@/analytics/teams.analytics';

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
  const url = `${process.env.DIRECTORY_API_URL}/v1/teams/${teamId}/ask`;
  const payload = { ask: { uid, status, closedByUid, closedReason, closedComment }, teamName };

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

export function useCloseAskMutation() {
  const analytics = useTeamAnalytics();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      // todo - add analytics
      // analytics.teamDetailUpdateAskClicked(getAnalyticsTeamInfo(team), payload.ask);
    },
  });
}
