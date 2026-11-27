import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { TeamNewsQueryKeys } from '@/services/team-news/constants';
import { createTeamNewsPost, type CreateTeamNewsPostPayload } from '@/services/team-news/team-news.service';

/** `teamUid` in the variables posts to that team instead (Home's \"Post as\", LAB-3342). It is not sent in the body. */
export type CreateTeamNewsPostVariables = CreateTeamNewsPostPayload & { teamUid?: string };

export function useCreateTeamNewsPost(teamUid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamUid: target, ...payload }: CreateTeamNewsPostVariables) =>
      createTeamNewsPost(target || teamUid, payload),
    onSuccess: (item: ITeamNewsItem, variables) => {
      queryClient.invalidateQueries({ queryKey: [TeamNewsQueryKeys.BY_TEAM, variables.teamUid || teamUid] });
      queryClient.invalidateQueries({ queryKey: [TeamNewsQueryKeys.GROUPED_BY_FOCUS_AREA] });
      queryClient.invalidateQueries({ queryKey: [TeamNewsQueryKeys.LIST] });
      return item;
    },
  });
}
