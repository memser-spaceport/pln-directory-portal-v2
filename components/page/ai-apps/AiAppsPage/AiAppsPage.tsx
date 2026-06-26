'use client';
import { useState } from 'react';

import { Button } from '@/components/common/Button/Button';

import { AiAppsGrid } from './components/AiAppsGrid';
import { CreateAiAppModal } from './components/CreateAiAppModal';

import s from './AiAppsPage.module.scss';

export function AiAppsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={s.root}>
      <div className={s.header}>
        <div className={s.titleBlock}>
          <h1 className={s.title}>AI Apps</h1>
          <p className={s.description}>Build your app, share with PL Infra teams</p>
        </div>
        <Button size="s" onClick={() => setIsModalOpen(true)}>
          Add your AI App
        </Button>
      </div>

      <AiAppsGrid />

      <CreateAiAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
