import React from 'react';
import { clsx } from 'clsx';
import s from '@/components/page/members/MembersFilter/MembersFilter.module.scss';
import { useFilterStore } from '@/services/members/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { GenericFilterToggle } from '@/components/common/filters/GenericFilterToggle';

interface Props {
  label: React.ReactNode;
  paramKey: string;
  onChange?: (checked: boolean) => void;
}

/**
 * FiltersPanelToggle - Member-specific toggle component
 *
 * Now uses GenericFilterToggle under the hood with member analytics.
 * Maintains backward compatibility with existing code.
 *
 * @example
 * ```tsx
 * <FiltersPanelToggle
 *   label="Show Office Hours"
 *   paramKey="hasOfficeHours"
 *   onChange={(checked) => console.log('Changed:', checked)}
 * />
 * ```
 */
export const FiltersPanelToggle = (props: Props) => {
  const { label, paramKey, onChange } = props;
  const { params } = useFilterStore();
  const { onMembersOHFilterToggled } = useMemberAnalytics();

  const checked = params.get(paramKey) === 'true';

  // Wrap onChange to include analytics
  const handleChange = (newChecked: boolean) => {
    // Track analytics
    onMembersOHFilterToggled({
      page: 'Members',
      option: paramKey,
      value: newChecked ? 'true' : 'false',
    });

    // Call original onChange if provided
    if (onChange) {
      onChange(newChecked);
    }
  };

  return (
    <GenericFilterToggle
      label={label}
      paramKey={paramKey}
      filterStore={useFilterStore}
      onChange={handleChange}
      className={clsx(s.Label, s.toggle)}
    />
  );
};
