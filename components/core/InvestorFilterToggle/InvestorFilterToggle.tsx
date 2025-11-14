import React from 'react';
import { clsx } from 'clsx';
import s from '@/components/page/members/MembersFilter/MembersFilter.module.scss';
import { useFilterStore } from '@/services/members/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { GenericFilterToggle } from '@/components/common/filters/GenericFilterToggle';

interface Props {
  label: string;
  paramKey: string;
}

/**
 * InvestorFilterToggle - Specialized toggle for investor filter
 *
 * Automatically clears investor-specific filters (check size, investment focus)
 * when the main investor toggle is turned off. Uses GenericFilterToggle under the hood.
 *
 * @example
 * ```tsx
 * <InvestorFilterToggle
 *   label="Show all Investors"
 *   paramKey="isInvestor"
 * />
 * ```
 */
export const InvestorFilterToggle = ({ label, paramKey }: Props) => {
  const { params } = useFilterStore();
  const { onMembersOHFilterToggled } = useMemberAnalytics();

  const checked = params.get(paramKey) === 'true';

  // Handle analytics
  const handleChange = (newChecked: boolean) => {
    onMembersOHFilterToggled({
      page: 'Members',
      option: paramKey,
      value: newChecked ? 'true' : 'false',
    });
  };

  // Clear related filters when turning OFF the investor toggle
  const handleBeforeChange = (isCurrentlyChecked: boolean, setParam: (key: string, value?: string) => void) => {
    if (isCurrentlyChecked) {
      // Turning OFF - clear investor-specific filters
      setParam('minTypicalCheckSize', undefined);
      setParam('maxTypicalCheckSize', undefined);
      setParam('investmentFocus', undefined);
    }
  };

  return (
    <GenericFilterToggle
      label={label}
      paramKey={paramKey}
      filterStore={useFilterStore}
      onChange={handleChange}
      onBeforeChange={handleBeforeChange}
      className={clsx(s.Label, s.toggle)}
    />
  );
};
