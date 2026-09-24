'use client';

import { useEffect } from 'react';

import { useSavedScopeStore } from '@/services/jobs/saved-scope.store';
import { Tabs } from '@/components/ui/tabs/Tabs';

const ALL_TAB = 'All';
const SAVED_TAB = 'Saved';

interface JobsScopeTabsProps {
  savedCount: number;
}

export function JobsScopeTabs({ savedCount }: JobsScopeTabsProps) {
  const savedScope = useSavedScopeStore((store) => store.savedScope);
  const setSavedScope = useSavedScopeStore((store) => store.setSavedScope);

  const activeTab = savedScope ? SAVED_TAB : ALL_TAB;

  useEffect(() => {
    // Avoid a jarring near-empty view when switching into a shorter tab mid-scroll.
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  const onTabClick = (tab: string) => {
    if (tab === activeTab) {
      return;
    }
    setSavedScope(tab === SAVED_TAB);
  };

  return (
    <Tabs
      variant="secondary"
      activeTab={activeTab}
      onTabClick={onTabClick}
      tabs={[{ name: ALL_TAB }, { name: SAVED_TAB, count: savedCount > 0 ? savedCount : undefined }]}
    />
  );
}
