import type { ITeamNewsGroupedResponse } from '@/types/team-news.types';

export type ForYouMatch = {
  teamUids: string[];
  /** Present only when For You matches by tags; undefined = teams only. */
  tags?: string[];
  /** Present with `tags`. Empty means the member picked no category tags. */
  categories?: string[];
};

/**
 * What For You matches on (LAB-3001). With News preferences on and a backend
 * that sends `forYouTags`: own and followed teams plus the member's tags.
 * Otherwise `forYouTeamUids` (own, followed and related teams), as before.
 */
export function resolveForYouMatch(
  response:
    | Pick<ITeamNewsGroupedResponse, 'forYouTeamUids' | 'forYouTags' | 'forYouOwnTeamUids' | 'forYouCategories'>
    | null
    | undefined,
  byTags: boolean,
): ForYouMatch {
  if (byTags && Array.isArray(response?.forYouTags) && Array.isArray(response?.forYouOwnTeamUids)) {
    return {
      teamUids: response.forYouOwnTeamUids,
      tags: response.forYouTags,
      categories: Array.isArray(response.forYouCategories) ? response.forYouCategories : [],
    };
  }
  return { teamUids: response?.forYouTeamUids ?? [] };
}
