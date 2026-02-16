import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer/utils/toast';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

interface SaveTeamData {
  teamFundraisingProfileUid: string;
  isPrepDemoDay?: boolean;
}

async function saveTeam(demoDayId: string, data: SaveTeamData): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/save`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to save team');
  }

  return true;
}

async function unsaveTeam(demoDayId: string, data: SaveTeamData): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/unsave`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to unsave team');
  }

  return true;
}

export function useSaveTeam(teamName?: string) {
  const queryClient = useQueryClient();
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useMutation<boolean, Error, SaveTeamData & { isSaved: boolean }>({
    mutationFn: (data) => {
      const { isSaved, ...payload } = data;
      return isSaved ? unsaveTeam(demoDayId, payload) : saveTeam(demoDayId, payload);
    },
    onSuccess: (_, variables) => {
      const action = variables.isSaved ? 'unsaved' : 'saved';
      toast.success(
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {`You ${action} ${teamName || '[TeamName]'}`}
          </span>
        </div>,
        {
          style: { width: '320px' },
          autoClose: 3000,
        },
      );

      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATS, demoDayId] });
    },
    onError: (error) => {
      toast.error(error?.message || 'Save request failed. Please try again.', {
        autoClose: 3000,
      });
    },
  });
}
