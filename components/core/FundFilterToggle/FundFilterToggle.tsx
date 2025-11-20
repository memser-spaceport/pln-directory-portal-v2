import React from 'react';
import { clsx } from 'clsx';
import s from '@/components/page/members/MembersFilter/MembersFilter.module.scss';
import { useTeamFilterStore } from '@/services/teams';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { GenericFilterToggle } from '@/components/common/filters/GenericFilterToggle';
import { triggerLoader } from '@/utils/common.utils';

interface Props {
  label: string;
  paramKey: string;
}

/**
 * FundFilterToggle - Specialized toggle for fund filter
 *
 * Automatically clears fund-specific filters (check size, investment focus)
 * when the main fund toggle is turned off. Uses GenericFilterToggle under the hood.
 *
 * @example
 * ```tsx
 * <FundFilterToggle
 *   label="Show all Funds"
 *   paramKey="isFund"
 * />
 * ```
 */
export const FundFilterToggle = ({ label, paramKey }: Props) => {
  const analytics = useTeamAnalytics();

  const handleChange = (newChecked: boolean) => {
    triggerLoader(true);
    analytics.onFilterApplied('isFund', newChecked ? 'true' : 'false');
  };

  // Clear related filters when turning OFF the fund toggle
  const handleBeforeChange = (isCurrentlyChecked: boolean, setParam: (key: string, value?: string) => void) => {
    if (isCurrentlyChecked) {
      // Turning OFF - clear fund-specific filters
      setParam('minTypicalCheckSize', undefined);
      setParam('maxTypicalCheckSize', undefined);
      setParam('investmentFocus', undefined);
    }
  };

  return (
    <GenericFilterToggle
      label={label}
      paramKey={paramKey}
      filterStore={useTeamFilterStore}
      onChange={handleChange}
      onBeforeChange={handleBeforeChange}
      className={clsx(s.Label, s.toggle)}
    />
  );
};
