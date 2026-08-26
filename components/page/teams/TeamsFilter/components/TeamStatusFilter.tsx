import React from 'react';

import { useTeamFilterStore } from '@/services/teams';
import { FilterSelect } from '@/components/common/filters/FilterSelect/FilterSelect';
import type { Option } from '@/components/form/FormSelect/types';
import { triggerLoader } from '@/utils/common.utils';

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
        triggerLoader(true);
        setParam('status', option?.value === 'ACTIVE' ? undefined : option?.value);
      }}
    />
  );
}
