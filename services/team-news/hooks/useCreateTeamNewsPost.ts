import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { TeamNewsQueryKeys } from '@/services/team-news/constants';
import { createTeamNewsPost, type CreateTeamNewsPostPayload } from '@/services/team-news/team-news.service';

export function useCreateTeamNewsPost(teamUid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTeamNewsPostPayload) => createTeamNewsPost(teamUid, payload),
    onSuccess: (item: ITeamNewsItem) => {
      queryClient.invalidateQueries({ queryKey: [TeamNewsQueryKeys.BY_TEAM, teamUid] });
      queryClient.invalidateQueries({ queryKey: [TeamNewsQueryKeys.GROUPED_BY_FOCUS_AREA] });
      queryClient.invalidateQueries({ queryKey: [TeamNewsQueryKeys.LIST] });
      return item;
    },
  });
}
