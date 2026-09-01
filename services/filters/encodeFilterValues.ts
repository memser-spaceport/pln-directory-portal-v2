import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED } from '@/constants/filters';

/** `['a', 'b']` -> `"a|b"`, escaping any separator inside a value. Inverse of `decodeFilterValues`. */
export function encodeFilterValues(values: string[]): string {
  return values
    .map((value) => value.replaceAll(FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED))
    .join(URL_QUERY_VALUE_SEPARATOR);
}
