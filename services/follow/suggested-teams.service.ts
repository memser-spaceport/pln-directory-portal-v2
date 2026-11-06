import { customFetch } from '@/utils/fetch-wrapper';
import type { ISuggestedTeam, ITeamNewsFollowSuggestionsResponse } from '@/types/team-news.types';

// GET /v1/team-news/follow-suggestions — auth required; the backend derives the
// suggestions from the current member; only the count is a param (Home's rail
// shows 3, News preferences 4). Returns [] on failure or when there are no
// suggestions, which hides the module.
export async function getSuggestedTeamsToFollow(limit = 3): Promise<ISuggestedTeam[]> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/team-news/follow-suggestions?limit=${limit}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    true,
  );
  if (!response?.ok) return [];
  const data = (await response.json()) as ITeamNewsFollowSuggestionsResponse;
  return data.items ?? [];
}
