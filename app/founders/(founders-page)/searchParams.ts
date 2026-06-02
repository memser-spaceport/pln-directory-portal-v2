import { createSearchParamsCache, parseAsArrayOf, parseAsFloat, parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs/server';
import { FUND_VALUES, FOUNDER_STATUS_VALUES } from '@/services/founders/constants';

export const foundersFilterParsers = {
  q: parseAsString.withDefault(''),
  fund: parseAsArrayOf(parseAsStringLiteral(FUND_VALUES), ',').withDefault([]),
  status: parseAsArrayOf(parseAsStringLiteral(FOUNDER_STATUS_VALUES), ',').withDefault([]),
  source: parseAsArrayOf(parseAsString, ',').withDefault([]),
  minAlignment: parseAsFloat.withDefault(0),
  minPlnProximity: parseAsFloat.withDefault(0),
  sort: parseAsString.withDefault('alignmentMax:desc'),
  page: parseAsInteger.withDefault(1),
  founderId: parseAsString.withDefault(''),
};

export const foundersFilterCache = createSearchParamsCache(foundersFilterParsers);
