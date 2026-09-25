'use client';

import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation/CheckboxListItemRepresentation';
import { SAVED_PARAM } from '@/services/jobs/savedParam';
import { useJobsFilterStore } from '@/services/jobs/store';

/**
 * Narrows the board to the roles the member bookmarked. An ordinary filter —
 * it rides the same store, the same URL sync, the applied-filters count and
 * Clear All as every checkbox beside it.
 *
 * No count: the neighbours show a facet from the backend ("how many match the
 * current filters"), and there is no such facet for saves.
 */
export function SavedJobsFilter() {
  const { params, setParam } = useJobsFilterStore();
  const checked = params.get(SAVED_PARAM) === 'true';

  return (
    <CheckboxListItemRepresentation
      label="Saved"
      checked={checked}
      onClick={() => setParam(SAVED_PARAM, checked ? undefined : 'true')}
    />
  );
}
