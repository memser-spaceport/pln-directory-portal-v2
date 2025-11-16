'use client';

import React from 'react';
import { FilterState } from '@/services/filters/types';
import { GenericRangeInput } from '@/components/common/filters/GenericRangeInput';

interface Props {
  label: string;
  minParamName: string;
  maxParamName: string;
  filterStore: () => FilterState;
  allowedRange: {
    min: number;
    max: number;
  };
  formatValue?: (value: number) => string;
  disabled?: boolean;
}

/**
 * FilterCheckSizeInput - Member-specific range input
 *
 * Now uses GenericRangeInput under the hood.
 * Maintains backward compatibility with existing code.
 *
 * @example
 * ```tsx
 * <FilterCheckSizeInput
 *   label="Typical Check Size"
 *   minParamName="minTypicalCheckSize"
 *   maxParamName="maxTypicalCheckSize"
 *   allowedRange={{ min: 0, max: 10000000 }}
 * />
 * ```
 */
export function FilterCheckSizeInput({
  label,
  minParamName,
  maxParamName,
  filterStore,
  allowedRange,
  formatValue,
  disabled = false,
}: Props) {
  return (
    <GenericRangeInput
      label={label}
      minParamName={minParamName}
      maxParamName={maxParamName}
      filterStore={filterStore}
      allowedRange={allowedRange}
      formatValue={formatValue}
      disabled={disabled}
    />
  );
}
