'use client';

import { useEffect, useRef, useState } from 'react';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';
import { checkAiAppLive } from '@/services/ai-apps/ai-apps.service';
import { FloatingFeedbackButton } from '../components/FloatingFeedbackButton';

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

/** Liveness polling cadence: ~3 minutes of 4s probes before giving up. */
const LIVENESS_INTERVAL_MS = 4000;
const LIVENESS_MAX_ATTEMPTS = 45;

/**
 * Reachability of the embedded app, gating the iframe. We never mount the
 * iframe until a server-side probe confirms the app answers — otherwise the
 * frame captures a raw gateway error page (504) while the container starts.
 */
type FrameStatus = 'checking' | 'live' | 'down';

export function AiAppDetailPage(props: Props) {
  const { uid } = props;

  const { app, isLoading, isError } = useAiApp(uid);
  const { currentUser } = useCurrentUserStore();
  const analytics = useAiAppsAnalytics();
  const trackedAppUid = useRef<string | null>(null);
  const iframeTracked = useRef<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [isRedeploying, setIsRedeploying] = useState(false);
  // Bumped by "Try again" to restart the polling effect after it gave up.
  const [retryToken, setRetryToken] = useState(0);
  // Result of the liveness polling, tagged with the generation it probed. A new
  // generation (fresh deploy or retry) makes the derived status fall back to
  // 'checking' without the effect having to reset any state synchronously.
  const [probeResult, setProbeResult] = useState<{ generation: string; status: 'live' | 'down' } | null>(null);

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

  const appUrl = app?.url ?? null;
  // One probe "generation" per deployed version (updatedAt changes on every
  // deploy) and per manual retry; probe results from older generations are
  // ignored, so a fresh deploy always re-checks.
  const probeGeneration = `${app?.updatedAt ?? ''}:${retryToken}`;
  const frameStatus: FrameStatus = probeResult?.generation === probeGeneration ? probeResult.status : 'checking';

  // Poll the backend liveness probe until the app answers, then mount the
  // iframe. Runs on first load and again after every redeploy (updatedAt
  // changes / the deploy flag drops), so gateway errors never reach the frame.
  useEffect(() => {
    if (!appUrl || isRedeploying) return;

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const probe = async () => {
      const live = await checkAiAppLive(uid);
      if (cancelled) return;
      if (live) {
        setProbeResult({ generation: probeGeneration, status: 'live' });
        return;
      }
      attempts += 1;
      if (attempts >= LIVENESS_MAX_ATTEMPTS) {
        setProbeResult({ generation: probeGeneration, status: 'down' });
        return;
      }
      timer = setTimeout(probe, LIVENESS_INTERVAL_MS);
    };

    probe();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [uid, appUrl, probeGeneration, isRedeploying]);

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

  // Trust the server-computed flag (creator or directory admin); the uid
  // comparison is only a fallback for API versions without `canManage` — the
  // login cookie's uid can go stale (e.g. after a dev DB reseed).
  const isCreator = app.canManage ?? (!!currentUser?.uid && currentUser.uid === app.member?.uid);
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

  const renderFrameArea = () => {
    if (isRedeploying) {
      return (
        <div className={s.frameState}>
          <div className={s.progress}>
            <div className={s.progressBar}>
              <div className={s.progressIndicator} />
            </div>
            <p className={s.progressTitle}>Redeploying the app</p>
            <p className={s.progressText}>This usually takes a couple of minutes — you can keep this page open.</p>
          </div>
        </div>
      );
    }

    if (frameStatus === 'checking') {
      return (
        <div className={s.frameState}>
          <div className={s.progress}>
            <div className={s.progressBar}>
              <div className={s.progressIndicator} />
            </div>
            <p className={s.progressTitle}>Starting the app</p>
            <p className={s.progressText}>Waiting for the app to come online…</p>
          </div>
        </div>
      );
    }

    if (frameStatus === 'down') {
      return (
        <div className={s.frameState}>
          <div className={s.progress}>
            <p className={s.progressTitle}>The app isn’t responding right now</p>
            <p className={s.progressText}>
              Something went wrong while loading this app. It may still be starting up — please try again in a moment.
            </p>
            <button type="button" className={s.retryButton} onClick={() => setRetryToken((t) => t + 1)}>
              Try again
            </button>
          </div>
        </div>
      );
    }

    return (
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
    );
  };

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
      {renderFrameArea()}
      <FloatingFeedbackButton appUid={app.uid} appName={app.name} />
    </div>
  );
}
