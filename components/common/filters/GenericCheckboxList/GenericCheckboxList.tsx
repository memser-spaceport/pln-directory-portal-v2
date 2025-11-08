import React, { useEffect, useState, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { FilterState } from '@/services/filters/types';
import { FilterOption } from '@/services/filters/commonTypes';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { CloseIcon, SearchIcon } from '@/components/icons';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';

import { SelectAll } from './components/SelectAll';
import { CheckboxListItem } from './components/CheckboxListItem';
import { useGetMergedItemsToRender } from './hooks/useGetMergedItemsToRender';

import s from './GenericCheckboxList.module.scss';

export interface GenericCheckboxListProps {
  /**
   * Label displayed above the search input
   */
  label: string;

  /**
   * URL parameter key to manage
   */
  paramKey: string;

  /**
   * Filter store to use (e.g., useFilterStore, useTeamFilterStore)
   */
  filterStore: () => FilterState;

  /**
   * Placeholder text for search input
   */
  placeholder?: string;

  /**
   * Number of items to show by default (before "Show more" is clicked)
   */
  defaultItemsToShow: number;

  /**
   * Hook to fetch data based on search input
   * @param input - Search query string
   * @param limit - Optional limit for results
   * @returns Object with optional data array
   */
  useGetDataHook: (input: string, limit?: number) => { data?: FilterOption[] };

  /**
   * Optional callback when selected values change
   * @param paramKey - The parameter key
   * @param values - Array of selected values (strings)
   */
  onChange?: (paramKey: string, values: string[]) => void;

  /**
   * Flag to clear search input (external control)
   */
  shouldClearSearch?: boolean;

  /**
   * Custom class name for the container
   */
  className?: string;
}

/**
 * Generic Checkbox List with Search
 *
 * Reusable checkbox list component with search functionality.
 * Works with any filter store created via createFilterStore.
 *
 * @example
 * ```tsx
 * // Simple usage
 * <GenericCheckboxList
 *   label="Search topics"
 *   paramKey="topics"
 *   placeholder="E.g. AI, Blockchain..."
 *   filterStore={useFilterStore}
 *   useGetDataHook={useGetTopics}
 *   defaultItemsToShow={5}
 * />
 *
 * // With onChange callback
 * <GenericCheckboxList
 *   label="Search roles"
 *   paramKey="roles"
 *   placeholder="E.g. Engineer, Designer..."
 *   filterStore={useFilterStore}
 *   useGetDataHook={useGetRoles}
 *   defaultItemsToShow={4}
 *   onChange={(key, values) => {
 *     console.log('Selected:', values);
 *   }}
 * />
 * ```
 */
export function GenericCheckboxList(props: GenericCheckboxListProps) {
  const {
    label,
    paramKey,
    filterStore,
    placeholder,
    useGetDataHook,
    defaultItemsToShow,
    onChange,
    shouldClearSearch,
    className,
  } = props;

  const [searchValue, setSearchValue] = useState('');

  const { params, setParam } = filterStore();

  // Get initial values from URL parameters
  const selectedValues = useMemo(() => {
    const paramValue = params.get(paramKey);
    if (!paramValue) return [];

    return paramValue.split(URL_QUERY_VALUE_SEPARATOR).map((value) => ({
      value: value.trim(),
      label: value.trim(),
    }));
  }, [params, paramKey]);

  // Fetch data based on search
  const { data = [] } = useGetDataHook(searchValue);

  // Merge backend data with selected values
  const itemsToRender = useGetMergedItemsToRender({
    beData: data,
    selectedData: selectedValues,
    searchValue,
    defaultItemsToShow,
  });

  // React Hook Form setup
  const methods = useForm<Record<string, FilterOption[]>>({
    defaultValues: { [paramKey]: selectedValues },
  });

  const { watch, setValue } = methods;
  const filterValues = watch(paramKey);

  // Sync form values to URL parameters (only when form values actually change)
  useEffect(() => {
    // Skip if filterValues is undefined (initial render before form is ready)
    if (filterValues === undefined) return;

    if (filterValues && filterValues.length > 0) {
      const valuesArr = filterValues.map((item) => item.value);
      const values = valuesArr.join(URL_QUERY_VALUE_SEPARATOR);

      // Only update if the value actually changed
      const currentValue = params.get(paramKey);
      if (currentValue !== values) {
        setParam(paramKey, values);

        // Call onChange callback if provided
        if (onChange) {
          onChange(paramKey, valuesArr);
        }
      }
    } else if (filterValues.length === 0) {
      // Only clear if there was a value before
      if (params.get(paramKey)) {
        setParam(paramKey, undefined);

        // Call onChange with empty array
        if (onChange) {
          onChange(paramKey, []);
        }
      }
    }
    // setParam and onChange are stable references, don't need them in deps
    // params is intentionally included to check current value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey, filterValues]);

  // Handle external search clear
  useEffect(() => {
    if (shouldClearSearch) {
      setSearchValue('');
    }
  }, [shouldClearSearch]);

  return (
    <FormProvider {...methods}>
      <div className={className}>
        <div className={s.label}>{label}</div>
        <DebouncedInput
          value={searchValue}
          ids={{
            root: '',
            input: '',
          }}
          classes={{
            root: s.inputRoot,
            input: s.input,
            flushBtn: s.flushBtn,
            clearBtn: s.clearBtn,
          }}
          onChange={setSearchValue}
          placeholder={placeholder}
          hideFlushIconOnValueInput
          clearIcon={<CloseIcon color="#64748b" />}
          flushIcon={<SearchIcon color="#64748b" className={s.searchIcon} />}
        />
        <div className={s.list}>
          {!!searchValue && <SelectAll data={data} paramKey={paramKey} setValue={setValue} selected={selectedValues} />}
          {itemsToRender.map((item) => {
            return (
              <CheckboxListItem
                key={item.value}
                item={item}
                values={selectedValues}
                setValue={setValue}
                paramKey={paramKey}
              />
            );
          })}
        </div>
      </div>
    </FormProvider>
  );
}
