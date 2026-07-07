'use client';

import { useEffect, useRef } from 'react';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';

import s from './AiAppDetailPage.module.scss';

interface Props {
  uid: string;
}

export function AiAppDetailPage(props: Props) {
  const { uid } = props;

  const { app, isLoading, isError } = useAiApp(uid);
  const analytics = useAiAppsAnalytics();
  const trackedAppUid = useRef<string | null>(null);
  const iframeTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!app || trackedAppUid.current === app.uid) return;
    trackedAppUid.current = app.uid;
    analytics.onDetailPageViewed(app.uid, app.name);
  }, [app, analytics]);

  useEffect(() => {
    if (isError && uid) {
      analytics.onIframeLoadFailed(uid, uid);
    }
  }, [isError, uid, analytics]);

  const handleIframeLoad = () => {
    if (!app || iframeTracked.current === app.uid) return;
    iframeTracked.current = app.uid;
    analytics.onIframeLoaded(app.uid, app.name);
  };

  if (isLoading) {
    return <div className={s.state}>Loading app…</div>;
  }

  if (isError) {
    return <div className={s.state}>Unable to load this app. Please try again later.</div>;
  }

  if (!app) {
    return <div className={s.state}>App not found.</div>;
  }

  return (
    <div className={s.root}>
      <iframe className={s.iframe} src={app.url} title={app.name} allow="fullscreen" onLoad={handleIframeLoad} />
    </div>
  );
}
