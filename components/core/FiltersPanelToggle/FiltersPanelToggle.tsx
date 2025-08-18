import React from 'react';
import { clsx } from 'clsx';
import s from '@/components/page/members/MembersFilter/MembersFilter.module.scss';
import { Switch } from '@base-ui-components/react/switch';
import { useFilterStore } from '@/services/members/store';

interface Props {
  label: string;
  paramKey: string;
}

export const FiltersPanelToggle = ({ label, paramKey }: Props) => {
  const { params, setParam } = useFilterStore();
  const checked = params.get(paramKey) === 'true';

  const handleChange = () => {
    setParam(paramKey, checked ? undefined : 'true');
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
