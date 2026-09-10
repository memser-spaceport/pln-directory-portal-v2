'use client';

import React from 'react';

import { useFilterStore } from '@/services/members/store';

import { FilterSearchInput } from '@/components/common/filters/FilterSearchInput';

interface Props {
  label?: string;
  placeholder: string;
  debounceMs?: number;
}

/**
 * The members rail's search field: the shared `FilterSearchInput` bound to the
 * members store.
 *
 * The markup, styles and debounce behaviour moved to
 * `components/common/filters/FilterSearchInput` so pages with their own filter
 * store could use them (AI Apps is the first). This wrapper keeps the existing
 * call sites — the members rail and demo-day's active + admin filters, which all
 * read the members store — importing the same name with the same props.
 */
export function FilterSearch({ label, placeholder, debounceMs = 700 }: Props) {
  return (
    <FilterSearchInput filterStore={useFilterStore} label={label} placeholder={placeholder} debounceMs={debounceMs} />
  );
}
