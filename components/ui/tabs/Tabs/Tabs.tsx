import React, { FC, PropsWithChildren, ReactNode } from 'react';

import s from './Tabs.module.css';
import { clsx } from 'clsx';

interface Props extends PropsWithChildren {
  tabs: { name: string; count?: number; endAdornment?: ReactNode }[];
  activeTab: string;
  errorInfo?: Record<string, boolean>;
  onTabClick: (item: string) => void;
  variant: 'primary' | 'secondary';
}

export const Tabs: FC<Props> = ({ tabs, activeTab, onTabClick, variant, errorInfo = {}, children }) => {
  return (
    <div
      className={clsx(s.root, {
        [s.secondary]: variant === 'secondary',
      })}
    >
      <div className={s.tabsList}>
        {tabs.map((tab, index) => (
          <div
            key={`${tab.name}-${index}`}
            className={clsx(s.tab, {
              [s.active]: tab.name === activeTab,
              [s.error]: errorInfo[tab.name] === true && tab.name === activeTab,
            })}
            onClick={() => onTabClick(tab.name)}
          >
            <p className={clsx(s.text)}>
              {tab.name} {variant === 'secondary' && tab.count !== undefined && tab.count > 0 ? `(${tab.count})` : ''}
            </p>
            {tab.count !== undefined && tab.count > 0 && <div className={s.count}>{tab.count}</div>}
            {tab.endAdornment}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
};
