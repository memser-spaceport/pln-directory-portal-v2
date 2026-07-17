'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';

import { AiAppsGrid } from './components/AiAppsGrid';
import { CreateAiAppModal } from './components/CreateAiAppModal';
import { FloatingFeedbackButton } from '../components/FloatingFeedbackButton';
import { ViewFeedbackEntryPoint } from '../components/ViewFeedbackEntryPoint';

import s from './AiAppsPage.module.scss';

export function AiAppsPage() {
  const [manualOpen, setManualOpen] = useState(false);
  const analytics = useAiAppsAnalytics();
  const hasTrackedPageView = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();

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
      const params = new URLSearchParams(searchParams.toString());
      params.delete('dialog');
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '/pl-infra/ai-apps', { scroll: false });
    }
  };

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <div className={s.header}>
          <div className={s.titleBlock}>
            <h1 className={s.title}>AI Apps</h1>
            <p className={s.description}>
              A sandbox to deploy your AI apps on LabOS infra and explore what PL Infra team members are building.
            </p>
          </div>
          <ViewFeedbackEntryPoint />
        </div>

        <AiAppsGrid onOpenCreateModal={handleOpenCreateModal} />

        <CreateAiAppModal isOpen={isModalOpen} onClose={handleCloseCreateModal} />
      </div>

      <FloatingFeedbackButton alignToContent />
    </div>
  );
}
