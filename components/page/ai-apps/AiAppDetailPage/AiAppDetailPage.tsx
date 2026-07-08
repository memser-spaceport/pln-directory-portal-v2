'use client';

import { useEffect, useRef, useState } from 'react';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';

import { AppSecretsPanel } from './components/AppSecretsPanel';

import s from './AiAppDetailPage.module.scss';

interface Props {
  uid: string;
}

const SETUP_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  DEPLOYING: 'Deploying',
  ERROR: 'Deploy failed',
};

export function AiAppDetailPage(props: Props) {
  const { uid } = props;

  const { app, isLoading, isError } = useAiApp(uid);
  const { currentUser } = useCurrentUserStore();
  const analytics = useAiAppsAnalytics();
  const trackedAppUid = useRef<string | null>(null);
  const iframeTracked = useRef<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [isRedeploying, setIsRedeploying] = useState(false);

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

  const isCreator = !!currentUser?.uid && currentUser.uid === app.member?.uid;
  const requiredEnvVars = app.requiredEnvVars ?? [];
  // A secrets app that isn't live yet (draft, deploying, or failed) shows the
  // setup card instead of an iframe onto a dead URL.
  const needsSetup = requiredEnvVars.length > 0 && app.status !== 'READY';

  if (needsSetup) {
    return (
      <div className={s.setupPage}>
        <div className={s.setupCard}>
          <div className={s.setupHeader}>
            <h1 className={s.setupTitle}>{app.name}</h1>
            <span className={s.statusBadge} data-status={app.status}>
              {SETUP_STATUS_LABELS[app.status] ?? app.status}
            </span>
          </div>
          {app.description && <p className={s.setupDescription}>{app.description}</p>}
          {app.status === 'ERROR' && app.notes && <p className={s.setupError}>Last deploy failed: {app.notes}</p>}
          {isCreator ? (
            <AppSecretsPanel app={app} />
          ) : (
            <p className={s.setupInfo}>
              This app is not deployed yet. Only {app.member?.name ?? 'its creator'} can provide the required values
              and deploy it.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      {isCreator && requiredEnvVars.length > 0 && (
        <div className={s.secretsBar}>
          <button type="button" className={s.secretsToggle} onClick={() => setShowSecrets((v) => !v)}>
            {showSecrets ? 'Hide secrets' : 'Update secrets & redeploy'}
          </button>
          {showSecrets && (
            <div className={s.secretsPanel}>
              <AppSecretsPanel app={app} onDeployingChange={setIsRedeploying} />
            </div>
          )}
        </div>
      )}
      {isRedeploying ? (
        // Hide the stale iframe while the container restarts — it would show a
        // raw gateway error page mid-redeploy.
        <div className={s.frameState}>Redeploying the app — this can take a couple of minutes…</div>
      ) : (
        <iframe
          // Remount after every deploy so the frame reloads instead of keeping
          // whatever it captured before the restart.
          key={app.updatedAt}
          className={s.iframe}
          src={app.url ?? undefined}
          title={app.name}
          allow="fullscreen"
          onLoad={handleIframeLoad}
        />
      )}
    </div>
  );
}
