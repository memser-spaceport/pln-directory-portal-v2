'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AI_APPS_SORT_OPTIONS, AI_APPS_SORT_PARAM } from '@/services/ai-apps/constants';

import { getAiAppsSort } from '@/services/ai-apps/utils/getAiAppsSort';
import { getLatestOwnAiApp } from '@/services/ai-apps/utils/getLatestOwnAiApp';
import { useCurrentUserStore } from '@/services/auth/store';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useAiAppsFilterStore } from '@/services/ai-apps/store';
import { useFilteredAiApps } from '@/services/ai-apps/hooks/useFilteredAiApps';

import { SortDropdown } from '@/components/common/filters/SortDropdown';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { McpHint } from '@/components/core/mcp-hints/McpHint';

import { AiAppsGrid } from './components/AiAppsGrid';
import { AiAppsFilter } from './components/AiAppsFilter';
import { CreateAiAppModal } from './components/CreateAiAppModal';
import { AiAppsMobileFilters } from './components/AiAppsMobileFilters';
import { FloatingFeedbackButton } from '../components/FloatingFeedbackButton';
import { ViewFeedbackEntryPoint } from '../components/ViewFeedbackEntryPoint';

import s from './AiAppsPage.module.scss';

export function AiAppsPage() {
  const [manualOpen, setManualOpen] = useState(false);
  const analytics = useAiAppsAnalytics();
  const hasTrackedPageView = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const { params, setParam } = useAiAppsFilterStore();
  const { apps, visibleApps, isLoading, isError } = useFilteredAiApps();
  const { currentUser, isHydrated } = useCurrentUserStore();
  // LAB-3136: the MCP hint names the member's own latest app, or offers the Starter Kit when they have none. It waits
  // (undefined) until the list and the member have loaded, and stays out when the list failed: then whether they own an
  // app is unknown.
  const latestOwnAppName = useMemo(
    () => (isLoading || isError || !isHydrated ? undefined : (getLatestOwnAiApp(apps, currentUser?.uid)?.name ?? null)),
    [apps, currentUser?.uid, isLoading, isError, isHydrated],
  );

  const openFromUrl = searchParams.get('dialog') === 'addAiApp';
  const isModalOpen = openFromUrl || manualOpen;
  const trackedUrlModal = useRef(false);

  useEffect(() => {
    if (hasTrackedPageView.current) return;
    hasTrackedPageView.current = true;
    analytics.onPageViewed();
  }, [analytics]);

  useEffect(() => {
    if (!openFromUrl) {
      trackedUrlModal.current = false;
      return;
    }
    if (trackedUrlModal.current) return;
    trackedUrlModal.current = true;
    analytics.onCreateModalOpened();
  }, [openFromUrl, analytics]);

  const handleOpenCreateModal = () => {
    analytics.onCreateModalOpened();
    setManualOpen(true);
  };

  const handleCloseCreateModal = () => {
    analytics.onCreateModalClosed();
    setManualOpen(false);

    if (openFromUrl) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete('dialog');
      const qs = nextParams.toString();
      router.replace(qs ? `?${qs}` : '/pl-infra/ai-apps', { scroll: false });
    }
  };

  const handleSortChange = (value: string) => {
    analytics.onSortChanged({ sort: value, source: 'masthead', resultCount: visibleApps.length });
    setParam(AI_APPS_SORT_PARAM, value);
  };

  const content = (
    <div className={s.content}>
      <div className={s.header}>
        <div className={s.titleBlock}>
          <div className={s.titleRow}>
            <h1 className={s.title}>AI Apps</h1>
            {/* Withheld until there is a real number: "(0)" over a loading or failed list states something false. */}
            {!isLoading && !isError && <span className={s.count}>({visibleApps.length})</span>}
          </div>
          <p className={s.description}>
            A sandbox to deploy your AI apps on LabOS infra and explore what PL Infra team members are building.
          </p>
        </div>
        <div className={s.headerActions}>
          {/* Wrapped rather than given a className: SortDropdown puts that on its
              trigger, so hiding the trigger strands the "Sort by:" label beside it. */}
          <div className={s.sortSlot}>
            <SortDropdown
              sortByLabel="Sort by:"
              options={AI_APPS_SORT_OPTIONS}
              currentSort={getAiAppsSort(params)}
              onSortChange={handleSortChange}
            />
          </div>
          <ViewFeedbackEntryPoint />
        </div>
      </div>

      <McpHint context="apps" latestAppName={latestOwnAppName} onGetStarterKit={handleOpenCreateModal} />

      <AiAppsMobileFilters />

      <AiAppsGrid onOpenCreateModal={handleOpenCreateModal} />

      <CreateAiAppModal isOpen={isModalOpen} onClose={handleCloseCreateModal} />
    </div>
  );

  return (
    <>
      <div className={s.pageFrame}>
        <DashboardPagesLayout filters={<AiAppsFilter />} content={content} />
      </div>

      {/* Outside the page frame: it's fixed to the viewport, not to the column. */}
      <FloatingFeedbackButton />
    </>
  );
}
