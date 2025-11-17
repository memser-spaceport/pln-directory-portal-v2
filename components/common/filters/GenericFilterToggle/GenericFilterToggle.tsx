import React from 'react';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { FilterState } from '@/services/filters/types';
import s from './GenericFilterToggle.module.scss';

export interface GenericFilterToggleProps {
  /**
   * Label text or React node to display
   */
  label: React.ReactNode;

  /**
   * URL parameter key to manage
   */
  paramKey: string;

  /**
   * Filter store to use (e.g., useFilterStore, useTeamFilterStore)
   */
  filterStore: () => FilterState;

  /**
   * Optional callback when toggle state changes
   * @param checked - New checked state
   */
  onChange?: (checked: boolean) => void;

  /**
   * Optional callback before state changes
   * Useful for clearing related filters
   * @param checked - Current checked state (before change)
   * @param setParam - Function to set parameters
   */
  onBeforeChange?: (checked: boolean, setParam: FilterState['setParam']) => void;

  /**
   * Custom class name for the container
   */
  className?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * Generic Filter Toggle Component
 *
 * Reusable toggle switch for filters that syncs with URL parameters.
 * Works with any filter store created via createFilterStore.
 *
 * @example
 * ```tsx
 * // Simple toggle
 * <GenericFilterToggle
 *   label="Show Active"
 *   paramKey="isActive"
 *   filterStore={useMyFilterStore}
 * />
 *
 * // Toggle with onChange callback
 * <GenericFilterToggle
 *   label="Office Hours"
 *   paramKey="hasOfficeHours"
 *   filterStore={useFilterStore}
 *   onChange={(checked) => {
 *     if (checked) clearOtherFilters();
 *   }}
 * />
 *
 * // Toggle that clears related filters when turned off
 * <GenericFilterToggle
 *   label="Show Investors"
 *   paramKey="isInvestor"
 *   filterStore={useFilterStore}
 *   onBeforeChange={(checked, setParam) => {
 *     if (checked) {
 *       // Clear investor-specific filters when turning off
 *       setParam('minCheckSize', undefined);
 *       setParam('maxCheckSize', undefined);
 *     }
 *   }}
 * />
 * ```
 */
export function GenericFilterToggle(props: GenericFilterToggleProps) {
  const { label, paramKey, filterStore, onChange, onBeforeChange, className, disabled = false } = props;

  const { params, setParam } = filterStore();
  const checked = params.get(paramKey) === 'true';

  const handleChange = () => {
    if (disabled) return;

    // Call onBeforeChange if provided (for clearing related filters, etc.)
    if (onBeforeChange) {
      onBeforeChange(checked, setParam);
    }

    // Toggle the parameter
    const newValue = checked ? undefined : 'true';
    setParam(paramKey, newValue);

    // Call onChange callback if provided
    if (onChange) {
      onChange(!checked);
    }
  };

  return (
    <label className={clsx(s.root, className, { [s.disabled]: disabled })}>
      {label}
      <Switch.Root className={s.switch} checked={checked} onCheckedChange={handleChange} disabled={disabled}>
        <Switch.Thumb className={s.thumb}>
          <div className={s.dot} />
        </Switch.Thumb>
      </Switch.Root>
    </label>
  );
}
