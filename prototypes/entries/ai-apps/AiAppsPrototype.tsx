'use client';

import { useState } from 'react';

import { AddAiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AddAiAppCard';
import { CreateAiAppModal } from '@/components/page/ai-apps/AiAppsPage/components/CreateAiAppModal';
import { AiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/components/AiAppCard';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

import page from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
import grid from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/AiAppsGrid.module.scss';
import detail from '@/components/page/ai-apps/AiAppDetailPage/AiAppDetailPage.module.scss';

import { mockAiApps, mockAppPreviews, mockPageCopy } from './mocks';

function AiAppDetail({ app }: { app: AiApp }) {
  return (
    <div className={detail.root}>
      <iframe className={detail.iframe} srcDoc={mockAppPreviews[app.uid]} title={app.name} allow="fullscreen" />
    </div>
  );
}

export default function AiAppsPrototype() {
  const [apps] = useState<AiApp[]>(mockAiApps);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const selected = apps.find((a) => a.uid === selectedUid) ?? null;

  if (selected) {
    return <AiAppDetail app={selected} />;
  }

  return (
    <div className={page.pageFrame}>
      <div className={page.content}>
        <div className={page.header}>
          <div className={page.titleBlock}>
            <h1 className={page.title}>{mockPageCopy.title}</h1>
            <p className={page.description}>{mockPageCopy.description}</p>
          </div>
        </div>

        <div className={grid.grid}>
          <AddAiAppCard onClick={() => setIsModalOpen(true)} />
          {apps.map((app) => (
            <AiAppCard key={app.uid} app={app} onSelect={() => setSelectedUid(app.uid)} />
          ))}
        </div>

        <CreateAiAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
}
