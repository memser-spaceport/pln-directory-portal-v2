'use client';

import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';

import { AiAppCard } from './components/AiAppCard';

import s from './AiAppsGrid.module.scss';

export function AiAppsGrid() {
  const { apps, isLoading } = useAiApps();

  if (isLoading) {
    return null;
  }

  if (apps.length === 0) {
    return <EmptyState title="No apps yet" description="Create your first AI app to get started." />;
  }

  return (
    <div className={s.grid}>
      {apps.map((app) => (
        <AiAppCard key={app.uid} app={app} />
      ))}
    </div>
  );
}
