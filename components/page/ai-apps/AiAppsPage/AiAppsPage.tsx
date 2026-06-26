'use client';
import { useState } from 'react';

import { AiAppsGrid } from './components/AiAppsGrid';
import { CreateAiAppModal } from './components/CreateAiAppModal';

import s from './AiAppsPage.module.scss';

export function AiAppsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <div className={s.header}>
          <div className={s.titleBlock}>
            <h1 className={s.title}>AI Apps</h1>
            <p className={s.description}>Build your app, share with PL Infra teams</p>
          </div>
        </div>

        <AiAppsGrid onOpenCreateModal={() => setIsModalOpen(true)} />

        <CreateAiAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
}
