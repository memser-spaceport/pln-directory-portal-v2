import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import s from '@/components/page/members/MembersFilter/MembersFilter.module.scss';
import { Switch } from '@base-ui-components/react/switch';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFilterStore } from '@/services/members/store';

interface Props {
  label: string;
  paramKey: string;
}

export const FiltersPanelToggle = ({ label, paramKey }: Props) => {
  const router = useRouter();
  const { params, setParam } = useFilterStore();
  const checked = params.get(paramKey) === 'true';

  const handleChange = () => {
    setParam(paramKey, checked ? undefined : 'true');
  };

  // Push to router when params change
  useEffect(() => {
    router.push(`?${params.toString()}`, { scroll: false });
  }, [params, router]);

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
