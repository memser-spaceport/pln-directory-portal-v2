'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AI_APPS_SORT_OPTIONS, AI_APPS_SORT_PARAM } from '@/services/ai-apps/constants';

import { getAiAppsSort } from '@/services/ai-apps/utils/getAiAppsSort';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useAiAppsFilterStore } from '@/services/ai-apps/store';
import { useFilteredAiApps } from '@/services/ai-apps/hooks/useFilteredAiApps';

import { SortDropdown } from '@/components/common/filters/SortDropdown';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';

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
  const { visibleApps, isLoading, isError } = useFilteredAiApps();

  const openFromUrl = searchParams.get('dialog') === 'addAiApp';
  const isModalOpen = openFromUrl || manualOpen;

  useEffect(() => {
    if (hasTrackedPageView.current) return;
    hasTrackedPageView.current = true;
    analytics.onPageViewed();
  }, [analytics]);

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
