import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED } from '@/constants/filters';

import { SAVED_PARAM } from './savedParam';

/* Not in the 'use client' hooks module, so the board's server page can pick the same params the browser does
   (LAB-2888): a server component can't call a function exported from a client module. */
const SINGLE_VALUE_KEYS = ['q', 'sort', SAVED_PARAM] as const;
const MULTI_VALUE_KEYS = ['roleCategory', 'seniority', 'focus', 'location', 'workplaceType'] as const;

export const pickJobsParams = (searchParams: URLSearchParams): URLSearchParams => {
  const picked = new URLSearchParams();
  for (const key of SINGLE_VALUE_KEYS) {
    const value = searchParams.get(key);
    if (value) picked.set(key, value);
  }
  for (const key of MULTI_VALUE_KEYS) {
    const parts: string[] = [];
    for (const raw of searchParams.getAll(key)) {
      if (raw) parts.push(...raw.split(URL_QUERY_VALUE_SEPARATOR).filter(Boolean));
    }
    for (const v of [...new Set(parts)]) {
      picked.append(key, v.replaceAll(FILTER_VALUE_SEPARATOR_ENCODED, FILTER_VALUE_SEPARATOR));
    }
  }
  return picked;
};
