'use client';

import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';

import { AddAiAppCard } from '../AddAiAppCard';

import { AiAppCard } from './components/AiAppCard';

import s from './AiAppsGrid.module.scss';

interface Props {
  onOpenCreateModal: () => void;
}

export function AiAppsGrid({ onOpenCreateModal }: Props) {
  const { apps, isLoading, isError } = useAiApps();

  if (isLoading) {
    return <div className={s.state}>Loading apps…</div>;
  }

  if (isError) {
    return <div className={s.state}>Unable to load apps. Please try again later.</div>;
  }

  return (
    <div className={s.grid}>
      <AddAiAppCard onClick={onOpenCreateModal} />
      {apps.map((app) => (
        <AiAppCard key={app.uid} app={app} />
      ))}
    </div>
  );
}
