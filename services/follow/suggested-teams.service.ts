import { customFetch } from '@/utils/fetch-wrapper';
import type { ISuggestedTeam, ITeamNewsFollowSuggestionsResponse } from '@/types/team-news.types';

// GET /v1/team-news/follow-suggestions — auth required; the backend derives the
// suggestions from the current member, so no params are needed. Returns [] on
// failure or when there are no suggestions, which hides the module.
export async function getSuggestedTeamsToFollow(): Promise<ISuggestedTeam[]> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/team-news/follow-suggestions?limit=3`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    true,
  );
  if (!response?.ok) return [];
  const data = (await response.json()) as ITeamNewsFollowSuggestionsResponse;
  return data.items ?? [];
}
