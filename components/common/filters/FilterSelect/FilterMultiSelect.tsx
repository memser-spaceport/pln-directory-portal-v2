'use client';

import Select from 'react-select';
import type { Option } from '@/components/form/FormSelect/types';
import { filterMultiSelectStyles } from './filterSelectStyles';

interface Props {
  readonly options: Option[];
  readonly value: Option[];
  readonly onChange: (value: Option[]) => void;
  readonly placeholder?: string;
  readonly isSearchable?: boolean;
  readonly 'aria-label'?: string;
}

export function FilterMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'All focus areas',
  isSearchable = false,
  'aria-label': ariaLabel,
}: Props) {
  return (
    <Select
      isMulti
      inputId={ariaLabel ? undefined : 'filter-multi-select'}
      aria-label={ariaLabel}
      options={options}
      value={value}
      onChange={(opts) => onChange([...(opts ?? [])])}
      placeholder={placeholder}
      isClearable
      closeMenuOnSelect={false}
      isSearchable={isSearchable}
      styles={filterMultiSelectStyles}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
    />
  );
}
