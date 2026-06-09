'use client';

import Select from 'react-select';
import type { Option } from '@/components/form/FormSelect/types';
import { filterSelectStyles } from './filterSelectStyles';

interface Props {
  readonly options: Option[];
  readonly value: Option | null;
  readonly onChange: (value: Option | null) => void;
  readonly placeholder?: string;
  readonly isClearable?: boolean;
  readonly isSearchable?: boolean;
  readonly 'aria-label'?: string;
}

export function FilterSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  isClearable = false,
  isSearchable = false,
  'aria-label': ariaLabel,
}: Props) {
  return (
    <Select
      inputId={ariaLabel ? undefined : 'filter-select'}
      aria-label={ariaLabel}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isClearable={isClearable}
      isSearchable={isSearchable}
      styles={filterSelectStyles}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
    />
  );
}
