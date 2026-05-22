import { customFetch } from '@/utils/fetch-wrapper';
import type {
  ICreateTeamNewsDiscussionRequest,
  ICreateTeamNewsDiscussionResponse,
  ITeamNewsGroupedResponse,
} from '@/types/team-news.types';
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

/**
 * Record that a forum topic was created in response to a news item.
 * Called from the client after the forum create-topic mutation succeeds.
 * Best-effort: failure here doesn't block the create flow, just means the
 * card won't show a "Join discussion" link on the next page load.
 */
export async function createTeamNewsDiscussionLink(
  newsItemUid: string,
  payload: ICreateTeamNewsDiscussionRequest,
): Promise<ICreateTeamNewsDiscussionResponse | null> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/team-news/${encodeURIComponent(newsItemUid)}/discussions`;
  try {
    const response = await customFetch(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      true,
    );
    if (!response?.ok) {
      return null;
    }
    return (await response.json()) as ICreateTeamNewsDiscussionResponse;
  } catch {
    return null;
  }
}
