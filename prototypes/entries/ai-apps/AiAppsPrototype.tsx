'use client';

import { useState } from 'react';

import { AddAiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AddAiAppCard';

import page from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
import grid from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/AiAppsGrid.module.scss';

import { AiAppCard } from './AiAppCard';
import { AiAppDetail } from './AiAppDetail';
import { CreateAiAppModal } from './CreateAiAppModal';
import { ManageAppModal } from './ManageAppModal';
import { mockAiApps, mockAppPreviews, mockPageCopy, type AiAppWithDoc } from './mocks';

import proto from './AiAppsPrototype.module.scss';

export default function AiAppsPrototype() {
  const [apps, setApps] = useState<AiAppWithDoc[]>(mockAiApps);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [manageUid, setManageUid] = useState<string | null>(null);
  // Stand-in for auth: production gates editing on `app.canManage` (creator or
  // admin). The toggle lets us demo the creator (editable) vs. visitor
  // (view-only) experience of the same app.
  const [viewAs, setViewAs] = useState<'creator' | 'visitor'>('creator');

  const selected = apps.find((a) => a.uid === selectedUid) ?? null;
  const managedApp = apps.find((a) => a.uid === manageUid) ?? null;
  const isCreator = viewAs === 'creator';

  const updateApp = (updated: AiAppWithDoc) =>
    setApps((prev) => prev.map((a) => (a.uid === updated.uid ? updated : a)));

  const saveManagedApp = (updated: AiAppWithDoc) => {
    updateApp(updated);
    setManageUid(null);
  };

  const roleToggle = (
    <div className={proto.roleToggle}>
      <span className={proto.roleLabel}>View as</span>
      <div className={proto.segmented}>
        <button
          type="button"
          data-active={isCreator}
          aria-pressed={isCreator}
          onClick={() => setViewAs('creator')}
        >
          Creator
        </button>
        <button
          type="button"
          data-active={!isCreator}
          aria-pressed={!isCreator}
          onClick={() => setViewAs('visitor')}
        >
          Visitor
        </button>
      </div>
    </div>
  );

  if (selected) {
    return (
      <div className={proto.shell}>
        {roleToggle}
        <AiAppDetail
          app={selected}
          previewSrcDoc={mockAppPreviews[selected.uid]}
          onBack={() => setSelectedUid(null)}
        />
      </div>
    );
  }

  return (
    <div className={proto.shell}>
      {roleToggle}
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
              <AiAppCard
                key={app.uid}
                app={app}
                canManage={isCreator}
                onSelect={() => setSelectedUid(app.uid)}
                onManage={() => setManageUid(app.uid)}
              />
            ))}
          </div>

          <CreateAiAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          {managedApp && (
            <ManageAppModal
              isOpen
              app={managedApp}
              onClose={() => setManageUid(null)}
              onSave={saveManagedApp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
