'use client';

import clsx from 'clsx';
import { useMemo } from 'react';

import type { ITeamNewsGroup, ITeamNewsItem } from '@/types/team-news.types';

import { Tabs } from '@/components/common/Tabs';
import { Badge } from '@/components/common/Badge';

import { ALL_TAB } from '@/components/page/home/TeamNews/constants';
import s from '@/components/page/home/TeamNews/components/TeamNewsTabs/TeamNewsTabs.module.scss';
import local from './NewsfeedV0.module.scss';

interface Props {
  groups: ITeamNewsGroup[];
  allItems: ITeamNewsItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

/**
 * Copy of the production `TeamNewsTabs`, identical except it passes a `tab` /
 * `label` class override to the shared `Tabs` so the focus-area tabs render at
 * 14px instead of 16px — so navigation no longer out-shouts the content
 * headings below it. Production `TeamNewsTabs` hardcodes its `classes` and can't
 * be told to do this, hence the local copy.
 */
export function NewsTabs({ groups, allItems, activeTab, onTabChange }: Props) {
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
                className={clsx({ [s.defaultBadge]: !isActive })}
              >
                {t.count}
              </Badge>
            ) : undefined,
        };
      })}
      classes={{ list: s.tabsList, tab: local.tabQuiet, label: local.tabQuiet }}
    />
  );
}
