'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { deployFailureKind, hasPrd } from '@/services/ai-apps/ai-apps.service';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useFilteredAiApps } from '@/services/ai-apps/hooks/useFilteredAiApps';
import { useAiAppManageAccess } from '@/services/ai-apps/hooks/useAiAppManageAccess';

import {
  EditAiAppModal,
  DeleteAiAppDialog,
  AiAppDetailsModal,
  DeploymentLogsModal,
  DeploymentSettingsModal,
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
  const { apps, visibleApps, filterCount, isLoading, isError } = useFilteredAiApps();
  const { canLikelyManage } = useAiAppManageAccess();

  // Which card's ⋯ action is open, if any. All management lives on the card —
  // the app (detail) page stays a clean preview. Modals render only while
  // open, so their forms seed fresh from the current record on mount.
  const [action, setAction] = useState<{ uid: string; type: ActionType } | null>(null);
  // The app whose one-pager a viewer is reading from the grid, if any.
  const [viewerUid, setViewerUid] = useState<string | null>(null);

  const isEmptyResult = !isLoading && !isError && visibleApps.length === 0 && filterCount > 0;

  useEffect(() => {
    if (isEmptyResult) {
      analytics.onEmptyResultsShown({ filterCount });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmptyResult, filterCount]);

  if (isLoading) {
    return <div className={s.state}>Loading apps…</div>;
  }

  if (isError) {
    return <div className={s.state}>Unable to load apps. Please try again later.</div>;
  }

  const containerVariants = getContainerVariants(!!shouldReduceMotion);
  const addCardVariants = getAddCardVariants();
  const cardVariants = getCardVariants(!!shouldReduceMotion);

  // Against the FULL list, not the filtered one: a modal opened from a card must
  // survive the filters changing underneath it.
  const actionApp = action ? (apps.find((app) => app.uid === action.uid) ?? null) : null;
  const viewerApp = viewerUid ? (apps.find((app) => app.uid === viewerUid) ?? null) : null;
  const closeAction = () => setAction(null);

  const openViewer = (uid: string, name: string) => {
    analytics.onAppDetailsOpened(uid, name);
    setViewerUid(uid);
  };

  const openLogs = (app: (typeof visibleApps)[number], source: 'menu' | 'failure-strip') => {
    analytics.onDeploymentLogsOpened({
      appUid: app.uid,
      appName: app.name,
      source,
      variant: deployFailureKind(app) ?? undefined,
    });
    setAction({ uid: app.uid, type: 'logs' });
  };

  if (visibleApps.length === 0 && filterCount > 0) {
    return <div className={s.state}>No apps match your filters. Try clearing some.</div>;
  }

  return (
    <>
      <motion.div className={s.grid} variants={containerVariants} initial="hidden" animate="show">
        {/* Part of the page, not of a result set: it steps out once the grid is answering a filter. */}
        {filterCount === 0 && (
          <motion.div variants={addCardVariants}>
            <AddAiAppCard onClick={onOpenCreateModal} />
          </motion.div>
        )}
        {visibleApps.map((app) => (
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
