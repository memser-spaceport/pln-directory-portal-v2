import { getTeamList } from '@/app/actions/teams.actions';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import type { ISuggestedTeam, ITeamNewsItem } from '@/types/team-news.types';
import { computeMockSuggestions } from './suggested-teams.mock-data';

const SUGGESTION_CANDIDATE_POOL_SIZE = 40;

// Called from a client-side query (useSuggestedTeamsToFollow), so — like
// toggleTeamNewsUpvote — the mock gate must be NEXT_PUBLIC_.
export async function getSuggestedTeamsToFollow(
  memberTeamUid: string | null,
  followedTeamUids: string[],
  recentNewsItems: ITeamNewsItem[],
  seed: string,
): Promise<ISuggestedTeam[]> {
  if (process.env.NEXT_PUBLIC_MOCK_TEAM_NEWS_V1 === 'true') {
    const { authToken } = getCookiesFromClient();
    const res = await getTeamList('', 1, SUGGESTION_CANDIDATE_POOL_SIZE, authToken);
    if (!res || 'isError' in res) return [];
    return computeMockSuggestions(res.data ?? [], memberTeamUid, followedTeamUids, recentNewsItems, seed);
  }

  // Real endpoint TBD by LAB-2094.
  return [];
}
