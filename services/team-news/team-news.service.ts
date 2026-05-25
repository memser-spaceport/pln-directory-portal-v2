import type { ITeamNewsGroupedResponse } from '@/types/team-news.types';
import { TEAM_NEWS_DEFAULT_WINDOW_DAYS } from './constants';

interface FetchGroupedOptions {
  windowDays?: number;
}

export async function getTeamNewsGroupedByFocusArea(
  options: FetchGroupedOptions = {},
): Promise<ITeamNewsGroupedResponse | null> {
  const windowDays = options.windowDays ?? TEAM_NEWS_DEFAULT_WINDOW_DAYS;
  const url = `${process.env.DIRECTORY_API_URL}/v1/team-news/grouped-by-focus-area?windowDays=${windowDays}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as ITeamNewsGroupedResponse;
  } catch {
    return null;
  }
}
