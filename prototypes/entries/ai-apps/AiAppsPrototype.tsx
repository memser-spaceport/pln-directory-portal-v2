'use client';

import { useState } from 'react';

import Link from 'next/link';

import { AddAiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AddAiAppCard';
import { CreateAiAppModal } from '@/components/page/ai-apps/AiAppsPage/components/CreateAiAppModal';
import { AiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/components/AiAppCard';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

import page from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
import grid from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/AiAppsGrid.module.scss';
import detail from '@/components/page/ai-apps/AiAppDetailPage/AiAppDetailPage.module.scss';

import { mockAiApps, mockAppPreviews, mockPageCopy } from './mocks';

function AiAppDetail({ app, onBack }: { app: AiApp; onBack: () => void }) {
  return (
    <div className={detail.root}>
      <div className={detail.header}>
        <div className={detail.titleBlock}>
          <button type="button" className={detail.backButton} onClick={onBack}>
            ← All AI Apps
          </button>
          <h1 className={detail.name}>{app.name}</h1>
          {app.description && <p className={detail.description}>{app.description}</p>}
          <p className={detail.author}>
            By{' '}
            <Link href={`/members/${app.member.uid}`} className={detail.authorLink}>
              {app.member.name}
            </Link>
          </p>
        </div>
        <div className={detail.actions}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Prototype: would open the deployed app in a new tab.');
            }}
            className={detail.openButton}
          >
            Open in New Tab ↗
          </a>
        </div>
      </div>

      <div className={detail.iframeContainer}>
        <iframe className={detail.iframe} srcDoc={mockAppPreviews[app.uid]} title={app.name} allow="fullscreen" />
      </div>
    </div>
  );
}

export default function AiAppsPrototype() {
  const [apps] = useState<AiApp[]>(mockAiApps);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const selected = apps.find((a) => a.uid === selectedUid) ?? null;

  if (selected) {
    return <AiAppDetail app={selected} onBack={() => setSelectedUid(null)} />;
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
