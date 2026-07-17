'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { ArrowBackIcon } from '@/components/icons';
import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';
import { useAiAppPrdContent } from '@/services/ai-apps/hooks/useAiAppPrdContent';

import { PrdViewerBody } from '../components/PrdViewerBody';

import { derivePrdPageState } from './derivePrdPageState';

import s from './AiAppPrdPage.module.scss';

interface Props {
  uid: string;
}

const APP_ERROR_MESSAGES: Record<'not-found' | 'forbidden' | 'network', string> = {
  // Collapsed on purpose — the coarse client-side guard doesn't check
  // per-app authorization, so a 'forbidden' app must look identical to a
  // 'not-found' one to avoid confirming its existence to an unauthorized viewer.
  'not-found': 'This app could not be found.',
  forbidden: 'This app could not be found.',
  network: 'Something went wrong. Please try again.',
};

export function AiAppPrdPage({ uid }: Props) {
  const { app, errorKind, isLoading: isAppLoading } = useAiApp(uid);
  const { content, error: prdError, isLoading: isPrdLoading } = useAiAppPrdContent(app?.prd ?? null, {
    enabled: !!app && !!app.prd,
  });
  const analytics = useAiAppsAnalytics();
  const trackedAppUid = useRef<string | null>(null);

  const state = derivePrdPageState(
    { app, errorKind, isLoading: isAppLoading },
    { content, error: prdError, isLoading: isPrdLoading },
  );

  useEffect(() => {
    if (state.status !== 'ready' || !app || trackedAppUid.current === app.uid) return;
    trackedAppUid.current = app.uid;
    analytics.onPrdPageViewed(app.uid, app.name);
  }, [state.status, app, analytics]);

  const backLink = (
    <Link href={`/pl-infra/ai-apps/${encodeURIComponent(uid)}`} className={s.backLink}>
      <ArrowBackIcon width={16} height={16} />
      Back to app
    </Link>
  );

  const showHeader = state.status !== 'loading' && state.status !== 'app-error' && !!app;

  const renderViewport = () => {
    switch (state.status) {
      case 'loading':
      case 'prd-loading':
        return <PrdViewerBody isLoading error={null} content={null} />;
      case 'app-error':
        return <p className={s.stateText}>{APP_ERROR_MESSAGES[state.errorKind]}</p>;
      case 'no-prd':
        return <p className={s.stateText}>This app no longer has a one-pager.</p>;
      case 'prd-error':
        return <PrdViewerBody isLoading={false} error={state.error} content={null} />;
      case 'ready':
        return <PrdViewerBody isLoading={false} error={null} content={state.prd} />;
    }
  };

  return (
    <div className={s.root}>
      {showHeader && (
        <div className={s.header}>
          {backLink}
          <p className={s.title}>{app?.name}</p>
        </div>
      )}
      <div className={s.viewport}>{renderViewport()}</div>
    </div>
  );
}
