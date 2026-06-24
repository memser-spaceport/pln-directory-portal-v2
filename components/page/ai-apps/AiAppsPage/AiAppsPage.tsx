'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button/Button';
import s from './AiAppsPage.module.scss';
import { CreateAiAppModal } from './components/CreateAiAppModal';

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
          Create AI App
        </Button>
      </div>

      <CreateAiAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
