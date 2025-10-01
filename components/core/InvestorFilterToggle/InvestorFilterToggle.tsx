import React from 'react';
import { clsx } from 'clsx';
import s from '@/components/page/members/MembersFilter/MembersFilter.module.scss';
import { Switch } from '@base-ui-components/react/switch';
import { useFilterStore } from '@/services/members/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';

interface Props {
  label: string;
  paramKey: string;
}

/**
 * Specialized toggle component for the investor filter that automatically
 * clears investor-specific filters when turned off
 */
export const InvestorFilterToggle = ({ label, paramKey }: Props) => {
  const { params, setParam } = useFilterStore();
  const checked = params.get(paramKey) === 'true';
  const { onMembersOHFilterToggled } = useMemberAnalytics();

  const handleChange = () => {
    const newValue = checked ? undefined : 'true';
    
    // Report analytics
    onMembersOHFilterToggled({ 
      page: 'Members', 
      option: paramKey, 
      value: checked ? 'false' : 'true' 
    });
    
    // Set the main investor parameter
    setParam(paramKey, newValue);
    
    // If turning off the investor filter, clear investor-specific filters
    if (checked) {
      // Clear typical check size filters
      setParam('minTypicalCheckSize', undefined);
      setParam('maxTypicalCheckSize', undefined);
      
      // Clear investment focus filter
      setParam('investmentFocus', undefined);
    }
  };

  return (
    <label className={clsx(s.Label, s.toggle)}>
      {label}
      <Switch.Root className={s.Switch} checked={checked} onCheckedChange={handleChange}>
        <Switch.Thumb className={s.Thumb}>
          <div className={s.dot} />
        </Switch.Thumb>
      </Switch.Root>
    </label>
  );
};
