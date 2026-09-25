'use client';

import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation/CheckboxListItemRepresentation';
import { useJobsFilters } from '@/services/jobs/hooks/useJobsQueries';
import { SAVED_PARAM } from '@/services/jobs/savedParam';
import { useJobsFilterStore } from '@/services/jobs/store';
import { filterStateFromURL } from '@/utils/jobs.utils';

export function SavedJobsFilter() {
  const { data } = useJobsFilters();
  const analytics = useJobsAnalytics();
  const { params, setParam } = useJobsFilterStore();
  const checked = params.get(SAVED_PARAM) === 'true';

  return (
    <CheckboxListItemRepresentation
      label="Saved"
      count={data?.saved}
      checked={checked}
      onClick={() => {
        if (!checked) {
          analytics.onJobsSavedFilterApplied({ filter_state: filterStateFromURL(params) });
        }
        setParam(SAVED_PARAM, checked ? undefined : 'true');
      }}
    />
  );
}
