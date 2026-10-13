'use client';

import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation/CheckboxListItemRepresentation';

import { useMockJobsFilterStore } from './mockJobsFilterStore';

/** Production's `SAVED_PARAM` (`services/jobs/savedParam.ts`), restated so the
 *  prototype does not import from `services/`. Same spelling, same value. */
export const SAVED_PARAM = 'saved';

/**
 * COPY-SIMPLIFY of production `SavedJobsFilter` (LAB-2629, "Save Job" as a
 * filter checkbox): the same `CheckboxListItemRepresentation` row under a
 * "My Activity" section, wired to the mock jobs store instead of
 * `useJobsFilterStore`. An ordinary filter, so it counts in the applied-filters
 * badge, Clear All takes it off, and it combines with every other facet.
 *
 * No count, as in production: its neighbours' counts are backend facets and
 * there is no facet for saves.
 */
export function JobBoardSavedFilter() {
  const { params, setParam } = useMockJobsFilterStore();
  const checked = params.get(SAVED_PARAM) === 'true';

  return (
    <CheckboxListItemRepresentation
      label="Saved"
      checked={checked}
      onClick={() => setParam(SAVED_PARAM, checked ? undefined : 'true')}
    />
  );
}
