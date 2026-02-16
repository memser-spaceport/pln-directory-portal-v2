import clsx from 'clsx';
import React, { ReactNode } from 'react';
import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';

import s from './Tabs.module.scss';

type TabValue = string;

export interface Tab {
  label: ReactNode;
  value: TabValue;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  value: TabValue;
  onValueChange: (value: TabValue) => void;
  variant?: 'underline' | 'pill';
  classes?: {
    root?: string;
    list?: string;
    tab?: string;
    indicator?: string;
    badge?: string;
    label?: string;
  };
}

export function Tabs(props: TabsProps) {
  const { tabs, value, onValueChange, variant = 'underline', classes } = props;

  const rootClass = clsx(s.root, classes?.root, {
    [s.pill]: variant === 'pill',
  });

  return (
    <BaseTabs.Root value={value} className={rootClass} onValueChange={(v) => onValueChange(v)}>
      <BaseTabs.List className={clsx(s.list, classes?.list)}>
        {tabs.map((tab) => (
          <BaseTabs.Tab key={tab.value} className={clsx(s.tab, classes?.tab)} value={tab.value} disabled={tab.disabled}>
            <span className={clsx(s.label, classes?.label)}>{tab.label}</span>
            {tab.badge && <span className={clsx(s.badge, classes?.badge)}>{tab.badge}</span>}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator className={clsx(s.indicator, classes?.indicator)} />
      </BaseTabs.List>
    </BaseTabs.Root>
  );
}
