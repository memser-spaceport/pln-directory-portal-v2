import React, { ReactNode } from 'react';
import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';
import clsx from 'clsx';

import s from './Tabs.module.scss';

export interface Tab {
  label: ReactNode;
  value: string;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  value: string;
  onValueChange: (value: string) => void;
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
  const { tabs, value, onValueChange, classes } = props;

  return (
    <BaseTabs.Root className={clsx(s.root, classes?.root)} value={value} onValueChange={(v) => onValueChange(v)}>
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
