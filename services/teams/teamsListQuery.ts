import qs from 'qs';

import type { ITeam, ITeamsSearchParams } from '@/types/teams.types';

const toPriorityValues = (val: string | undefined) =>
  (val ?? '')
    ?.split('|')
    .filter(Boolean)
    .map((v) => (v === '-1' ? '99' : v));

/**
 * The query string the teams list sends to the API for a set of URL filters.
 *
 * Its own module, with no `'use client'`, because two places must build it identically (LAB-2922): the browser's
 * infinite list, and the server page that renders page 1 into the HTML. The string doubles as the key that tells the
 * list whether the server's page is for the filters it is showing.
 */
export function buildTeamsListQuery(searchParams: ITeamsSearchParams): string {
  return qs.stringify({
    ...searchParams,
    sort: searchParams.sort
      ?.split(',')
      .map((s: string) => s.toLowerCase())
      .join(':'),
    investmentFocus: searchParams.investmentFocus?.split('|').filter(Boolean),
    priorities: toPriorityValues(searchParams.priorities),
  });
}

/** Page 1 of the teams list as the server fetched it, keyed on the query it was fetched for (LAB-2922). */
export type ServerTeamsPage = {
  key: string;
  items: ITeam[];
  total: number;
  followingTotal: number;
};
