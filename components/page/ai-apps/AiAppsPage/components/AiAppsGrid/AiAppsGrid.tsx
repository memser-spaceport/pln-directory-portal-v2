'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';
import { useAiAppManageAccess } from '@/services/ai-apps/hooks/useAiAppManageAccess';
import { hasPrd } from '@/services/ai-apps/ai-apps.service';
import {
  EditAiAppModal,
  DeploymentSettingsModal,
  DeploymentLogsModal,
  DeleteAiAppDialog,
  AiAppDetailsModal,
} from '@/components/page/ai-apps/dynamicActionModals';

import { AddAiAppCard } from '../AddAiAppCard';

import { getAddCardVariants, getCardVariants, getContainerVariants } from './AiAppsGrid.variants';
import { AiAppCard } from './components/AiAppCard';

import s from './AiAppsGrid.module.scss';

type ActionType = 'edit' | 'deployment' | 'logs' | 'delete';

interface Props {
  onOpenCreateModal: () => void;
}

export function AiAppsGrid({ onOpenCreateModal }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const analytics = useAiAppsAnalytics();
  const { apps, isLoading, isError } = useAiApps();
  const { canLikelyManage } = useAiAppManageAccess();

  // Which card's ⋯ action is open, if any. All management lives on the card —
  // the app (detail) page stays a clean preview. Modals render only while
  // open, so their forms seed fresh from the current record on mount.
  const [action, setAction] = useState<{ uid: string; type: ActionType } | null>(null);
  // The app whose one-pager a viewer is reading from the grid, if any.
  const [viewerUid, setViewerUid] = useState<string | null>(null);

  if (isLoading) {
    return <div className={s.state}>Loading apps…</div>;
  }

  if (isError) {
    return <div className={s.state}>Unable to load apps. Please try again later.</div>;
  }

  const containerVariants = getContainerVariants(!!shouldReduceMotion);
  const addCardVariants = getAddCardVariants();
  const cardVariants = getCardVariants(!!shouldReduceMotion);

  const actionApp = action ? (apps.find((app) => app.uid === action.uid) ?? null) : null;
  const viewerApp = viewerUid ? (apps.find((app) => app.uid === viewerUid) ?? null) : null;
  const closeAction = () => setAction(null);

  const openViewer = (uid: string, name: string) => {
    analytics.onAppDetailsOpened(uid, name);
    setViewerUid(uid);
  };

  const openLogs = (app: (typeof apps)[number], source: 'menu' | 'failure-strip') => {
    analytics.onDeploymentLogsOpened(app.uid, app.name, source);
    setAction({ uid: app.uid, type: 'logs' });
  };

  return (
    <>
      <motion.div className={s.grid} variants={containerVariants} initial="hidden" animate="show">
        <motion.div variants={addCardVariants}>
          <AddAiAppCard onClick={onOpenCreateModal} />
        </motion.div>
        {apps.map((app) => (
          <motion.div key={app.uid} variants={cardVariants}>
            <AiAppCard
              app={app}
              canManage={canLikelyManage(app.member.uid)}
              onEdit={() => setAction({ uid: app.uid, type: 'edit' })}
              onDeployment={() => setAction({ uid: app.uid, type: 'deployment' })}
              onLogs={(source) => openLogs(app, source)}
              onDelete={() => setAction({ uid: app.uid, type: 'delete' })}
              onViewDetails={() => openViewer(app.uid, app.name)}
            />
          </motion.div>
        ))}
      </motion.div>

      {actionApp && action?.type === 'edit' && <EditAiAppModal app={actionApp} onClose={closeAction} />}
      {actionApp && action?.type === 'deployment' && <DeploymentSettingsModal app={actionApp} onClose={closeAction} />}
      {/* Conditional render is load-bearing: unmounting on close is what aborts
          the modal's in-flight log fetches (its queryFn consumes the signal). */}
      {actionApp && action?.type === 'logs' && <DeploymentLogsModal app={actionApp} onClose={closeAction} />}
      {actionApp && action?.type === 'delete' && <DeleteAiAppDialog app={actionApp} onClose={closeAction} />}
      {viewerApp && hasPrd(viewerApp) && (
        <AiAppDetailsModal
          isOpen
          uid={viewerApp.uid}
          appName={viewerApp.name}
          prdUrl={viewerApp.prd as string}
          onClose={() => setViewerUid(null)}
        />
      )}
    </>
  );
}
