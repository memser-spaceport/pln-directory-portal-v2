import React from 'react';
import { FilterOption } from '@/services/filters/commonTypes';
import { useFilterStore } from '@/services/members/store';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';

interface Props {
  label: string;
  paramKey: string;
  placeholder?: string;
  defaultItemsToShow: number;
  useGetDataHook: (input: string, limit?: number) => { data?: FilterOption[] };
  shouldClearSearch?: boolean;
  onChange?: (paramKey: string, values: string[]) => void;
  onSearch?: (searchText: string) => void;
  onSelectAll?: (wasChecked: boolean) => void;
}

/**
 * FilterCheckboxListWithSearch - Member-specific checkbox list
 *
 * Now uses GenericCheckboxList under the hood with member analytics.
 * Maintains backward compatibility with existing code.
 *
 * @example
 * ```tsx
 * <FilterCheckboxListWithSearch
 *   label="Search topics"
 *   paramKey="topics"
 *   placeholder="E.g. AI, Blockchain..."
 *   useGetDataHook={useGetTopics}
 *   defaultItemsToShow={5}
 * />
 * ```
 */
export function FilterCheckboxListWithSearch(props: Props) {
  const { label, paramKey, placeholder, useGetDataHook, defaultItemsToShow, shouldClearSearch, onChange, onSearch, onSelectAll } = props;

  return (
    <GenericCheckboxList
      label={label}
      paramKey={paramKey}
      placeholder={placeholder}
      filterStore={useFilterStore}
      useGetDataHook={useGetDataHook}
      defaultItemsToShow={defaultItemsToShow}
      shouldClearSearch={shouldClearSearch}
      onChange={onChange}
      onSearch={onSearch}
      onSelectAll={onSelectAll}
    />
  );
}
