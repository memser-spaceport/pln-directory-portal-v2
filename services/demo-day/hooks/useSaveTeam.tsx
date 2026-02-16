import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer/utils/toast';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { TeamsListResponse } from '@/services/demo-day/hooks/useGetTeamsList';

interface SaveTeamData {
  teamFundraisingProfileUid: string;
  isPrepDemoDay?: boolean;
}

type MutationVariables = SaveTeamData & { isSaved: boolean };

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

function toggleSavedInList(
  list: TeamsListResponse | undefined,
  uid: string,
  newSaved: boolean,
): TeamsListResponse | undefined {
  if (!list) return list;
  return list.map((team) => (team.uid === uid ? { ...team, saved: newSaved } : team));
}

export function useSaveTeam() {
  const queryClient = useQueryClient();
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useMutation<
    boolean,
    Error,
    MutationVariables,
    { previousTeamsList?: TeamsListResponse; previousAllProfiles?: TeamsListResponse }
  >({
    mutationFn: (data) => {
      const { isSaved, ...payload } = data;
      return isSaved ? unsaveTeam(demoDayId, payload) : saveTeam(demoDayId, payload);
    },
    onMutate: async (variables) => {
      const { teamFundraisingProfileUid, isSaved } = variables;
      const newSaved = !isSaved;

      // Cancel in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId] });
      await queryClient.cancelQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId] });
      // Snapshot previous values
      const previousTeamsList = queryClient.getQueryData<TeamsListResponse>([
        DemoDayQueryKeys.GET_TEAMS_LIST,
        demoDayId,
      ]);
      const previousAllProfiles = queryClient.getQueryData<TeamsListResponse>([
        DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES,
        demoDayId,
      ]);

      // Optimistically update teams list
      queryClient.setQueryData<TeamsListResponse>([DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId], (old) =>
        toggleSavedInList(old, teamFundraisingProfileUid, newSaved),
      );

      // Optimistically update all fundraising profiles
      queryClient.setQueryData<TeamsListResponse>([DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId], (old) =>
        toggleSavedInList(old, teamFundraisingProfileUid, newSaved),
      );

      return { previousTeamsList, previousAllProfiles };
    },
    onSuccess: () => {
      // Refetch to ensure server state is in sync
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId] });
      queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATS, demoDayId] });
    },
    onError: (error, _, context) => {
      // Roll back to previous values on error
      if (context?.previousTeamsList) {
        queryClient.setQueryData([DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId], context.previousTeamsList);
      }
      if (context?.previousAllProfiles) {
        queryClient.setQueryData(
          [DemoDayQueryKeys.GET_ALL_FUNDRAISING_PROFILES, demoDayId],
          context.previousAllProfiles,
        );
      }

      toast.error(error?.message || 'Save request failed. Please try again.', {
        autoClose: 3000,
      });
    },
  });
}
