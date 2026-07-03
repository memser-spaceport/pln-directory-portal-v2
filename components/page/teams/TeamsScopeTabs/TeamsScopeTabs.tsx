'use client';

import { useEffect } from 'react';
import { Tabs } from '@/components/ui/tabs/Tabs';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { useTeamFilterStore } from '@/services/teams';
import { ITeamsSearchParams } from '@/types/teams.types';

const ALL_TAB = 'All';
const FOLLOWING_TAB = 'Following';

interface TeamsScopeTabsProps {
  searchParams: ITeamsSearchParams;
  followingTotal?: number;
}

export function TeamsScopeTabs(props: TeamsScopeTabsProps) {
  const { searchParams, followingTotal } = props;
  const setParam = useTeamFilterStore((store) => store.setParam);
  const analytics = useTeamAnalytics();

  const activeTab = searchParams.followingOnly === 'true' ? FOLLOWING_TAB : ALL_TAB;

  useEffect(() => {
    // Avoid a jarring near-empty view when switching into a shorter tab mid-scroll.
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  const onTabClick = (tab: string) => {
    if (tab === activeTab) return;
    if (tab === FOLLOWING_TAB) {
      analytics.onFollowingTabSelected({ followingTotal });
    } else {
      analytics.onAllTabSelected();
    }
    setParam('followingOnly', tab === FOLLOWING_TAB ? 'true' : '');
  };

  return (
    <Tabs
      variant="secondary"
      activeTab={activeTab}
      onTabClick={onTabClick}
      tabs={[{ name: ALL_TAB }, { name: FOLLOWING_TAB, count: followingTotal }]}
    />
  );
}
