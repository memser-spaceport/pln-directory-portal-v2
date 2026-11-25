import { customFetch } from '@/utils/fetch-wrapper';

import { PROFILE_EVENTS_FETCH_LIMIT, memberEventsUrl } from './profile-events.service';

/** A stop for a wrong `total`: 1,000 events. */
export const MY_PAST_EVENTS_MAX_PAGES = 20;

/**
 * The uids of the ended events a member said they were going to, from `GET /v1/members/:uid/events?group=past`, 50 a
 * call (LAB-3418). Asked for the viewer's own uid, so hidden rows are included, as for the Going marks. Needs the
 * viewer's token; callers gate on a signed-in viewer so `customFetch` can't loop.
 */
export async function getMyPastEventUids(memberUid: string): Promise<string[]> {
  const uids = new Set<string>();
  for (let page = 1; page <= MY_PAST_EVENTS_MAX_PAGES; page++) {
    const response: Response | undefined = await customFetch(
      memberEventsUrl(memberUid, { group: 'past', page, limit: PROFILE_EVENTS_FETCH_LIMIT }),
      { method: 'GET', cache: 'no-store' },
      true,
    );
    if (!response?.ok) throw new Error(`Member past events responded with ${response?.status ?? 'no response'}`);

    const body = await response.json();
    const items: unknown = body?.past?.items;
    if (!Array.isArray(items)) throw new Error('Member past events have an unexpected shape');
    items.forEach((item) => {
      const uid: unknown = item?.uid;
      if (typeof uid === 'string' && uid) uids.add(uid);
    });
    if (!items.length || page * PROFILE_EVENTS_FETCH_LIMIT >= (Number(body.past.total) || 0)) break;
  }
  return Array.from(uids);
}
