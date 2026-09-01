import React from 'react';

import { useTeamFilterStore } from '@/services/teams';
import { FilterSelect } from '@/components/common/filters/FilterSelect/FilterSelect';
import type { Option } from '@/components/form/FormSelect/types';
import { triggerLoader } from '@/utils/common.utils';
import { useTeamAnalytics } from '@/analytics/teams.analytics';

const STATUS_OPTIONS: Option[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'All', value: 'ALL' },
];

/**
 * Directory Admin only team status filter (Active/Inactive/All).
 * Rendering is gated by the caller — non-admins never see this control.
 */
export function TeamStatusFilter() {
  const { params, setParam } = useTeamFilterStore();
  const { onTeamsStatusFilterSelected } = useTeamAnalytics();
  const currentValue = params.get('status') ?? 'ACTIVE';
  const selected = STATUS_OPTIONS.find((option) => option.value === currentValue) ?? STATUS_OPTIONS[0];

  return (
    <FilterSelect
      options={STATUS_OPTIONS}
      value={selected}
      isSearchable={false}
      isClearable={false}
      aria-label="Team status"
      onChange={(option) => {
        const status = (option?.value ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'ALL';
        triggerLoader(true);
        setParam('status', status === 'ACTIVE' ? undefined : status);
        onTeamsStatusFilterSelected({ status });
      }}
    />
  );
}
