'use client';
import { useEffect, useRef, useState } from 'react';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';

import { AiAppsGrid } from './components/AiAppsGrid';
import { CreateAiAppModal } from './components/CreateAiAppModal';

import s from './AiAppsPage.module.scss';

export function AiAppsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const analytics = useAiAppsAnalytics();
  const hasTrackedPageView = useRef(false);

  useEffect(() => {
    if (hasTrackedPageView.current) return;
    hasTrackedPageView.current = true;
    analytics.onPageViewed();
  }, [analytics]);

  const handleOpenCreateModal = () => {
    analytics.onCreateModalOpened();
    setIsModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    analytics.onCreateModalClosed();
    setIsModalOpen(false);
  };

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <div className={s.header}>
          <div className={s.titleBlock}>
            <h1 className={s.title}>AI Apps</h1>
            <p className={s.description}>Build your app, share with PL Infra teams</p>
          </div>
        </div>

        <AiAppsGrid onOpenCreateModal={handleOpenCreateModal} />

        <CreateAiAppModal isOpen={isModalOpen} onClose={handleCloseCreateModal} />
      </div>
    </div>
  );
}
