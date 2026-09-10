import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED } from '@/constants/filters';

/**
 * `"a|b"` -> `['a', 'b']`.
 *
 * The separator is a legal character inside a value, so values carry it escaped;
 * this reverses that. Inverse of `encodeFilterValues`.
 */
export function decodeFilterValues(raw: string | null | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(URL_QUERY_VALUE_SEPARATOR)
    .map((value) => value.trim().replaceAll(FILTER_VALUE_SEPARATOR_ENCODED, FILTER_VALUE_SEPARATOR))
    .filter(Boolean);
}
