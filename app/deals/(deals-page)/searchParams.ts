import { createSearchParamsCache, parseAsString, parseAsArrayOf, parseAsStringLiteral, parseAsInteger } from 'nuqs/server';

export const DEAL_SORT_VALUES = ['newest', 'alphabetical'] as const;

export const dealsFilterParsers = {
  q: parseAsString.withDefault(''),
  categories: parseAsArrayOf(parseAsString, ',').withDefault([]),
  audience: parseAsArrayOf(parseAsString, ',').withDefault([]),
  sort: parseAsStringLiteral(DEAL_SORT_VALUES).withDefault('newest'),
  page: parseAsInteger.withDefault(1),
};

export const dealsFilterCache = createSearchParamsCache(dealsFilterParsers);
