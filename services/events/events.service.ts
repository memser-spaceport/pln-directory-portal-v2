import type { IHomeEvent, IHomeEvents } from '@/types/home.types';
import type { UpcomingEvent } from '@/services/events/hooks/useUpcomingEvents';

const TIMEOUT_MS = 5000;

/**
 * Upcoming IRL events for Home's rail, server-side and public.
 *
 * `days`, `limit` and `sort=soonest` come with LAB-3071; the body stays the same array, and the total is in the
 * `X-Total-Count` header. Before that is deployed the endpoint ignores the params, so the caller trims the list
 * itself, and the total falls back to the array's length. Throws on failure, so the caller drops the section.
 */
export async function getUpcomingEvents({ days, limit }: { days: number; limit: number }): Promise<IHomeEvents> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/irl/events/upcoming?days=${days}&limit=${limit}&sort=soonest`;
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Upcoming events responded with ${response.status}`);
  }

  const data = (await response.json()) as UpcomingEvent[];
  const rows = Array.isArray(data) ? data : [];
  const events: IHomeEvent[] = rows.map((e) => ({
    uid: e.uid,
    name: e.name,
    startDate: e.startDate,
    endDate: e.endDate,
    location: e.location ?? '',
    locationUid: e.locationUid ?? null,
  }));

  const header = Number.parseInt(response.headers.get('X-Total-Count') ?? '', 10);
  return { events, total: Number.isFinite(header) && header >= 0 ? header : events.length };
}
