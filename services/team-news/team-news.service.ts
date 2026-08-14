import { customFetch } from '@/utils/fetch-wrapper';
import type {
  ITeamNewsByTeamResponse,
  ITeamNewsGroupedResponse,
  ITeamNewsPopularResponse,
  ITeamNewsUpvoteStatus,
} from '@/types/team-news.types';
import { getHeader } from '@/utils/common.utils';
import { TEAM_NEWS_DEFAULT_WINDOW_DAYS, TEAM_NEWS_POPULAR_LIMIT, TEAM_NEWS_PREVIEW_LIMIT } from './constants';
import { MOCK_TEAM_NEWS_GROUPED_RESPONSE } from './team-news.mock-data';

interface FetchGroupedOptions {
  windowDays?: number;
}

export interface FetchTeamNewsByTeamOptions {
  page?: number;
  limit?: number;
  q?: string;
}

export function buildTeamNewsByTeamUrl(teamUid: string, options: FetchTeamNewsByTeamOptions = {}): string {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.set('page', String(options.page));
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.q?.trim()) params.set('q', options.q.trim());
  const qs = params.toString();
  return `${process.env.DIRECTORY_API_URL}/v1/teams/${encodeURIComponent(teamUid)}/team-news${qs ? `?${qs}` : ''}`;
}

export async function fetchTeamNewsByTeam(
  teamUid: string,
  options: FetchTeamNewsByTeamOptions = {},
  authToken?: string,
): Promise<ITeamNewsByTeamResponse | null> {
  const url = buildTeamNewsByTeamUrl(teamUid, options);

  try {
    // Auth is optional, but without it `viewerHasUpvoted` comes back as the
    // anonymous view — same convention as the grouped/popular fetchers below.
    const response = await fetch(url, {
      cache: 'no-store',
      headers: getHeader(authToken),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as ITeamNewsByTeamResponse;
  } catch {
    return null;
  }
}

export async function getTeamNewsGroupedByFocusArea(
  options: FetchGroupedOptions = {},
  authToken?: string,
): Promise<ITeamNewsGroupedResponse | null> {
  if (process.env.MOCK_TEAM_NEWS === 'true') {
    return MOCK_TEAM_NEWS_GROUPED_RESPONSE;
  }

  const windowDays = options.windowDays ?? TEAM_NEWS_DEFAULT_WINDOW_DAYS;
  const url = `${process.env.DIRECTORY_API_URL}/v1/team-news/grouped-by-focus-area?windowDays=${windowDays}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: getHeader(authToken),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as ITeamNewsGroupedResponse;
  } catch {
    return null;
  }
}

// Fetches "Popular this week" — server-ranked stories (>=2 upvotes in the last 7
// days, capped by `limit`). Auth is optional; passing the token is harmless and
// keeps this consistent with the grouped feed's SSR fetch. Returns null on
// failure so the caller can fall back to hiding the module.
export async function getTeamNewsPopular(
  limit: number = TEAM_NEWS_POPULAR_LIMIT,
  authToken?: string,
): Promise<ITeamNewsPopularResponse | null> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/team-news/popular?limit=${limit}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: getHeader(authToken),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as ITeamNewsPopularResponse;
  } catch {
    return null;
  }
}

/**
 * Ingestion time of the newest news item the feed would show, or null when
 * there is none. Drives the Home button's new-news dot.
 *
 * Returns null rather than throwing on failure: a dot is ambient, and a header
 * that surfaces a network error to get one would be worse than a header with
 * no dot. `null` collapses "no news", "not loaded" and "request failed" into
 * the same harmless answer.
 */
export async function getTeamNewsLatestAt(): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/team-news/latest`, { cache: 'no-store' });
    if (!response.ok) return null;
    const { latestAt } = (await response.json()) as { latestAt: string | null };
    return latestAt ?? null;
  } catch {
    return null;
  }
}

// Called from a client-side mutation (useTeamNewsUpvoteToggle). POST to upvote,
// DELETE to remove; both return the authoritative { upvoteCount, viewerHasUpvoted }.
// Throws on failure so React Query's onError fires and the optimistic overlay rolls back.
export async function toggleTeamNewsUpvote(uid: string, upvoted: boolean): Promise<ITeamNewsUpvoteStatus> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/team-news/${encodeURIComponent(uid)}/upvote`,
    { method: upvoted ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' } },
    true,
  );
  if (!response?.ok) throw new Error('Failed to toggle team news upvote');
  return (await response.json()) as ITeamNewsUpvoteStatus;
}

// ── View impressions ─────────────────────────────────────────────────────────

const IMPRESSIONS_BATCH_SIZE = 200;

// Public endpoint (no auth needed/sent — signed-out visitors record views the
// same as signed-in ones). Every occurrence of a uid increments viewCount by
// 1 server-side; unknown uids are silently ignored.
export async function recordTeamNewsImpressions(uids: string[]): Promise<void> {
  const batches: string[][] = [];
  for (let i = 0; i < uids.length; i += IMPRESSIONS_BATCH_SIZE) {
    batches.push(uids.slice(i, i + IMPRESSIONS_BATCH_SIZE));
  }
  // allSettled, not all: each chunk is independently best-effort — one
  // rejected batch shouldn't be entangled with the others' outcomes.
  await Promise.allSettled(batches.map(postImpressionsBatch));
}

async function postImpressionsBatch(newsItemUids: string[]): Promise<void> {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/team-news/impressions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newsItemUids }),
  });
  if (!response.ok) throw new Error('Failed to record team news impressions');
}

// Used only for the leave-flush (see useTeamNewsImpressions): sendBeacon
// survives an actual tab-close/navigation, where a plain fetch can be
// aborted mid-flight. Returns false (caller keeps its queue) if the browser
// can't accept the beacon, so nothing is silently dropped.
export function sendTeamNewsImpressionsBeacon(uids: string[]): boolean {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon || uids.length === 0) return false;
  const blob = new Blob([JSON.stringify({ newsItemUids: uids })], { type: 'application/json' });
  return navigator.sendBeacon(`${process.env.DIRECTORY_API_URL}/v1/team-news/impressions`, blob);
}
