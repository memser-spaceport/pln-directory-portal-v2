'use client';

import { useState } from 'react';

import { AddAiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AddAiAppCard';

import page from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
import grid from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/AiAppsGrid.module.scss';

import { AiAppCard } from './AiAppCard';
import { AiAppDetail } from './AiAppDetail';
import { CreateAiAppModal } from './CreateAiAppModal';
import { ManageAppModal } from './ManageAppModal';
import { DeploymentSettingsModal } from './DeploymentSettingsModal';
import { DeleteAppDialog } from './DeleteAppDialog';
import { OnePagerViewer } from './OnePagerViewer';
import { mockAiApps, mockAppPreviews, mockPageCopy, type AiAppWithDoc } from './mocks';

import proto from './AiAppsPrototype.module.scss';

type ActionType = 'edit' | 'deployment' | 'delete';

export default function AiAppsPrototype() {
  const [apps, setApps] = useState<AiAppWithDoc[]>(mockAiApps);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  // Which tile's ⋯ menu action is open, if any. All management lives on the
  // tile — the app (detail) page stays a clean preview.
  const [action, setAction] = useState<{ uid: string; type: ActionType } | null>(null);
  // The app whose 1-pager a visitor is previewing from the grid, if any.
  const [viewerUid, setViewerUid] = useState<string | null>(null);
  // Stand-in for auth: production gates editing on `app.canManage` (creator or
  // admin). The toggle lets us demo the creator (editable) vs. visitor
  // (view-only) experience of the same app.
  const [viewAs, setViewAs] = useState<'creator' | 'visitor'>('creator');

  const selected = apps.find((a) => a.uid === selectedUid) ?? null;
  const actionApp = action ? apps.find((a) => a.uid === action.uid) ?? null : null;
  const viewerApp = viewerUid ? apps.find((a) => a.uid === viewerUid) ?? null : null;
  const isCreator = viewAs === 'creator';

  const updateApp = (updated: AiAppWithDoc) =>
    setApps((prev) => prev.map((a) => (a.uid === updated.uid ? updated : a)));

  const closeAction = () => setAction(null);

  const saveEdit = (updated: AiAppWithDoc) => {
    updateApp(updated);
    closeAction();
  };

  const deleteApp = (uid: string) => {
    setApps((prev) => prev.filter((a) => a.uid !== uid));
    closeAction();
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

  // Management surfaces (edit / deployment / delete / 1-pager) — rendered on
  // both the grid and the detail page so the detail-page ⋯ menu can open them.
  const actionSurfaces = (
    <>
      {actionApp && action?.type === 'edit' && (
        <ManageAppModal isOpen app={actionApp} onClose={closeAction} onSave={saveEdit} />
      )}
      {actionApp && action?.type === 'deployment' && (
        <DeploymentSettingsModal isOpen app={actionApp} onClose={closeAction} onRedeploy={updateApp} />
      )}
      <DeleteAppDialog
        isOpen={!!actionApp && action?.type === 'delete'}
        appName={actionApp?.name ?? ''}
        onClose={closeAction}
        onConfirm={() => action && deleteApp(action.uid)}
      />
      {viewerApp?.onePager && (
        <OnePagerViewer isOpen onePager={viewerApp.onePager} onClose={() => setViewerUid(null)} />
      )}
    </>
  );

  if (selected) {
    return (
      <div className={proto.shell}>
        {roleToggle}
        <AiAppDetail
          app={selected}
          previewSrcDoc={mockAppPreviews[selected.uid]}
          onBack={() => setSelectedUid(null)}
          canManage={isCreator}
          onEdit={() => setAction({ uid: selected.uid, type: 'edit' })}
          onDeployment={() => setAction({ uid: selected.uid, type: 'deployment' })}
          onDelete={() => setAction({ uid: selected.uid, type: 'delete' })}
          onViewOnePager={() => setViewerUid(selected.uid)}
        />
        {actionSurfaces}
      </div>
    );
  }

  return (
    <div className={proto.shell}>
      {roleToggle}
      <div className={`${page.pageFrame} ${proto.frameMobile}`}>
        <div className={`${page.content} ${proto.contentMobile}`}>
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
                onEdit={() => setAction({ uid: app.uid, type: 'edit' })}
                onDeployment={() => setAction({ uid: app.uid, type: 'deployment' })}
                onDelete={() => setAction({ uid: app.uid, type: 'delete' })}
                onViewOnePager={() => setViewerUid(app.uid)}
              />
            ))}
          </div>

          <CreateAiAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

          {actionSurfaces}
        </div>
      </div>
    </div>
  );
}
