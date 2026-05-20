import clsx from 'clsx';
import { useMemo } from 'react';

import type { ITeamNewsGroup, ITeamNewsItem } from '@/types/team-news.types';

import { Tabs } from '@/components/common/Tabs';
import { Badge } from '@/components/common/Badge';

import { ALL_TAB } from '../../constants';

import s from './TeamNewsTabs.module.scss';

interface TeamNewsTabsProps {
  groups: ITeamNewsGroup[];
  allItems: ITeamNewsItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function TeamNewsTabs({ groups, allItems, activeTab, onTabChange }: TeamNewsTabsProps) {
  const tabs = useMemo(() => {
    const result = [{ id: ALL_TAB, label: 'All', count: allItems.length }];
    for (const g of groups) {
      result.push({ id: g.focusArea.title, label: g.focusArea.title, count: g.total });
    }
    return result;
  }, [groups, allItems]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      tabs={tabs.map((t) => {
        const isActive = activeTab === t.id;

        return {
          value: t.id,
          label: t.label,
          badge:
            t.count > 0 ? (
              <Badge
                variant={isActive ? 'brand' : 'default'}
                noBorder={!isActive}
                className={clsx({
                  [s.defaultBadge]: !isActive,
                })}
              >
                {t.count}
              </Badge>
            ) : undefined,
        };
      })}
      classes={{ list: s.tabsList }}
    />
  );
}
