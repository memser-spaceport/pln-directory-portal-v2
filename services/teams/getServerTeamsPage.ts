import { getTeamList } from '@/app/actions/teams.actions';
import { buildTeamsListQuery, type ServerTeamsPage } from '@/services/teams/teamsListQuery';
import type { ITeam, ITeamsSearchParams } from '@/types/teams.types';
import { ITEMS_PER_PAGE } from '@/utils/constants';

/**
 * Page 1 of the list for the URL's filters, fetched the way the browser fetches it, so the server HTML carries the
 * teams and a link to each profile (LAB-2922).
 *
 * The filters are read as the filter store reads them, every URL param with the last value winning
 * (`Object.fromEntries` over `URLSearchParams`), and the query is built by the same function. So the key matches the
 * list's own once the store is filled. The viewer's token goes along, as the browser's does. A failure returns nothing
 * and the list loads in the browser, as it always has.
 */
export async function getServerTeamsPage(
  params: { [key: string]: string | string[] | undefined },
  authToken: string | undefined,
): Promise<ServerTeamsPage | undefined> {
  const raw = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) raw.append(name, v);
  }
  const key = buildTeamsListQuery(Object.fromEntries(raw.entries()) as unknown as ITeamsSearchParams);

  try {
    const result = await getTeamList(key, 1, ITEMS_PER_PAGE, authToken || undefined);
    if ('isError' in result) {
      return undefined;
    }
    return {
      key,
      // The same trimmed list item the browser's fetcher casts to ITeam.
      items: (result.data ?? []) as unknown as ITeam[],
      total: result.totalItems ?? 0,
      followingTotal: result.followingTotal ?? 0,
    };
  } catch {
    return undefined;
  }
}
