import { customFetch } from '@/utils/fetch-wrapper';

/** Enough for every event a member could be going to in Home's 30-day window. */
export const MY_UPCOMING_EVENTS_LIMIT = 50;

/**
 * The uids of the events a member is going to that haven't ended, from `GET /v1/members/:uid/events?group=upcoming`
 * (LAB-3215). Asked for the viewer's own uid, so hidden rows are included: "Going" is about attendance, not about what
 * the profile shows. Needs the viewer's token; callers gate on a signed-in viewer so `customFetch` can't loop.
 */
export async function getMyUpcomingEventUids(memberUid: string): Promise<string[]> {
  const params = new URLSearchParams({ group: 'upcoming', limit: String(MY_UPCOMING_EVENTS_LIMIT) });
  const response: Response | undefined = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/${encodeURIComponent(memberUid)}/events?${params.toString()}`,
    { method: 'GET', cache: 'no-store' },
    true,
  );
  if (!response?.ok) {
    throw new Error(`Member events responded with ${response?.status ?? 'no response'}`);
  }

  const body = await response.json();
  const items: unknown = body?.upcoming?.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (item && typeof item === 'object' ? (item as { uid?: unknown }).uid : undefined))
    .filter((uid): uid is string => typeof uid === 'string' && uid.length > 0);
}
