import React from 'react';
import { FilterOption } from '@/services/filters/commonTypes';
import { useFilterStore } from '@/services/members/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';

interface Props {
  label: string;
  paramKey: string;
  placeholder?: string;
  defaultItemsToShow: number;
  useGetDataHook: (input: string, limit?: number) => { data?: FilterOption[] };
  shouldClearSearch?: boolean;
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
  const { label, paramKey, placeholder, useGetDataHook, defaultItemsToShow, shouldClearSearch } = props;
  const { onMembersTopicsFilterSelected, onMembersRolesFilterSelected } = useMemberAnalytics();

  // Handle analytics when values change
  const handleChange = (key: string, values: string[]) => {
    if (key === 'topics') {
      onMembersTopicsFilterSelected({ page: 'Members', topics: values });
    } else if (key === 'roles') {
      onMembersRolesFilterSelected({ page: 'Members', roles: values });
    }
  };

  return (
    <GenericCheckboxList
      label={label}
      paramKey={paramKey}
      placeholder={placeholder}
      filterStore={useFilterStore}
      useGetDataHook={useGetDataHook}
      defaultItemsToShow={defaultItemsToShow}
      shouldClearSearch={shouldClearSearch}
      onChange={handleChange}
    />
  );
}
