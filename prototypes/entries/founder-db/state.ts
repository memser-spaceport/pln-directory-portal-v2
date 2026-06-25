import type { FundTag, FounderStatus } from '@/services/founders/types';

// Mirrors app/founders/(founders-page)/searchParams.ts (new design) but as local
// React state instead of nuqs URL state — same keys, same defaults.
//
// v0 note: production defaults sort to `lastSignalAt:desc`. The v0 prototype defaults
// to `alignmentMax:desc` so the re-introduced Alignment column + cut-line are visible
// on load. Both sorts are still selectable.

export type Filters = {
  q: string;
  fund: FundTag[];
  status: FounderStatus[];
  source: string[];
  isRaising: boolean;
  focusArea: string[];
  sort: string;
  page: number;
  founderId: string;
};

export const DEFAULT_FILTERS: Filters = {
  q: '',
  fund: [],
  status: [],
  source: [],
  isRaising: false,
  focusArea: [],
  sort: 'alignmentMax:desc', // v0: lead with alignment (prod default is lastSignalAt:desc)
  page: 1,
  founderId: '',
};

export type FilterPatch = Partial<{ [K in keyof Filters]: Filters[K] | null }>;

// Matches nuqs setFilters semantics: a partial patch where `null` resets the key
// to its default. The second `options` arg (history) is accepted and ignored.
export type SetFilters = (patch: FilterPatch, options?: unknown) => void;

export function applyPatch(current: Filters, patch: FilterPatch): Filters {
  const next = { ...current };
  (Object.keys(patch) as (keyof Filters)[]).forEach((key) => {
    const value = patch[key];
    // @ts-expect-error — null means "reset to default" for the matching key
    next[key] = value === null ? DEFAULT_FILTERS[key] : value;
  });
  return next;
}
