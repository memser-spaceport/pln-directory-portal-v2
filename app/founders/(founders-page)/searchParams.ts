import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import { FUND_VALUES, FOUNDER_STATUS_VALUES } from '@/services/founders/constants';

export const foundersFilterParsers = {
  q: parseAsString.withDefault(''),
  fund: parseAsArrayOf(parseAsStringLiteral(FUND_VALUES), ',').withDefault([]),
  status: parseAsArrayOf(parseAsStringLiteral(FOUNDER_STATUS_VALUES), ',').withDefault([]),
  source: parseAsArrayOf(parseAsString, ',').withDefault([]),
  isRaising: parseAsBoolean.withDefault(false),
  focusArea: parseAsArrayOf(parseAsString, ',').withDefault([]),
  sort: parseAsString.withDefault('lastSignalAt:desc'),
  page: parseAsInteger.withDefault(1),
  founderId: parseAsString.withDefault(''),
};

export const foundersFilterCache = createSearchParamsCache(foundersFilterParsers);
