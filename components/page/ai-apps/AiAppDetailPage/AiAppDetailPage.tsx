'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';
import { useAiAppManageAccess } from '@/services/ai-apps/hooks/useAiAppManageAccess';
import { checkAiAppLive, hasPrd } from '@/services/ai-apps/ai-apps.service';
import { ArrowBackIcon, DocumentIcon } from '@/components/icons';
import { AppActionsMenu } from '@/components/page/ai-apps/AiAppsPage/components/AppActionsMenu';
import {
  EditAiAppModal,
  DeploymentSettingsModal,
  DeleteAiAppDialog,
  AiAppDetailsModal,
} from '@/components/page/ai-apps/dynamicActionModals';
import { FloatingFeedbackButton } from '../components/FloatingFeedbackButton';

import { AppSecretsPanel } from './components/AppSecretsPanel';

import s from './AiAppDetailPage.module.scss';

interface Props {
  uid: string;
}

type Action = 'edit' | 'deployment' | 'delete';

const SETUP_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  DEPLOYING: 'Deploying',
  ERROR: 'Deploy failed',
};

/**
 * Liveness polling cadence: ~6 minutes of 4s probes before giving up — the
 * pod-up → domain-registration gap after a deploy has been observed to take
 * 1–5 minutes, so giving up sooner strands users on "Try again".
 */
const LIVENESS_INTERVAL_MS = 4000;
const LIVENESS_MAX_ATTEMPTS = 90;

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
  const { canLikelyManage } = useAiAppManageAccess();
  const router = useRouter();
  const analytics = useAiAppsAnalytics();
  const trackedAppUid = useRef<string | null>(null);
  const trackedDraftSetupUid = useRef<string | null>(null);
  const iframeTracked = useRef<string | null>(null);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [showDetails, setShowDetails] = useState(false);
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

  const requiredEnvVars = app?.requiredEnvVars ?? [];
  // Genuinely "never deployed" only means DRAFT — DEPLOYING/ERROR have their
  // own dedicated flags below (which correctly respect `isRedeploying`).
  // Checking `status !== 'READY'` here too would also catch a DEPLOYING app
  // between polls of our own voluntary redeploy, bypassing that guard and
  // yanking into this mandatory branch mid-flight.
  const needsSetup = !!app && requiredEnvVars.length > 0 && app.status === 'DRAFT';
  // A failed deploy (runner error, or a stuck deploy the backend settled to
  // ERROR) is surfaced as a full status card — never a broken iframe — with the
  // error notes and a retry path for the creator/admin.
  const deployFailed = app?.status === 'ERROR';
  // An in-flight deploy someone else started (agent redeploy, another admin).
  // While OUR deploy runs (isRedeploying) the secrets panel or the deployment
  // settings modal owns the UI instead, so neither is unmounted mid-flight.
  const deployInProgress = app?.status === 'DEPLOYING' && !isRedeploying;

  useEffect(() => {
    if (!app || app.status !== 'DRAFT' || !needsSetup || trackedDraftSetupUid.current === app.uid) return;
    trackedDraftSetupUid.current = app.uid;
    analytics.onDraftSetupViewed({ appUid: app.uid, appName: app.name });
  }, [app, needsSetup, analytics]);

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

  // Don't swap to a loading shell when cached app data is already present —
  // that would unmount AppSecretsPanel and discard in-progress secret drafts.
  if (isLoading && !app) {
    return <div className={s.state}>Loading app…</div>;
  }

  if (isError && !app) {
    return <div className={s.state}>Unable to load this app. Please try again later.</div>;
  }

  if (!app) {
    return <div className={s.state}>App not found.</div>;
  }

  // Trust the server-computed flag (creator or directory admin); the uid
  // comparison is only a fallback for API versions without `canManage` — the
  // login cookie's uid can go stale (e.g. after a dev DB reseed).
  const isCreator = app.canManage ?? (!!currentUser?.uid && currentUser.uid === app.member?.uid);

  // Shown both for an app that genuinely isn't deployed yet (needsSetup) and
  // for a deploy in progress or failed — the top bar's "Deployment settings"
  // menu item is the only voluntary entry point for a healthy app now.
  if (needsSetup || deployFailed || deployInProgress) {
    return (
      <div className={s.setupPage}>
        <div className={s.setupContent}>
          <div className={s.setupCard}>
            <div className={s.setupHeader}>
              <h1 className={s.setupTitle}>{app.name}</h1>
              <span className={s.statusBadge} data-status={app.status}>
                {SETUP_STATUS_LABELS[app.status] ?? app.status}
              </span>
            </div>
            {app.description && <p className={s.setupDescription}>{app.description}</p>}
            {app.status === 'ERROR' && app.notes && <p className={s.setupError}>Last deploy failed: {app.notes}</p>}
            {deployInProgress ? (
              <div className={s.progress}>
                <div className={s.progressBar}>
                  <div className={s.progressIndicator} />
                </div>
                <p className={s.progressText}>
                  A deploy is in progress — this page updates automatically once it finishes.
                </p>
              </div>
            ) : isCreator ? (
              <AppSecretsPanel app={app} onDeployingChange={setIsRedeploying} />
            ) : (
              <p className={s.setupInfo}>
                {deployFailed
                  ? `The last deploy of this app failed. Only ${app.member?.name ?? 'its creator'} or an admin can retry it.`
                  : `This app is not deployed yet. Only ${app.member?.name ?? 'its creator'} can provide the required values and deploy it.`}
              </p>
            )}
          </div>
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
      <div className={s.topBar}>
        <Link href="/pl-infra/ai-apps" className={s.backLink}>
          <ArrowBackIcon width={16} height={16} />
          Back to all
        </Link>
        <div className={s.topBarActions}>
          {hasPrd(app) && (
            <button
              type="button"
              className={s.detailsButton}
              onClick={() => setShowDetails(true)}
              aria-label={`App details for ${app.name}`}
            >
              <span className={s.detailsBadge}>
                <DocumentIcon aria-hidden />
                App Details
              </span>
            </button>
          )}
          {canLikelyManage(app.member.uid) && (
            <AppActionsMenu
              app={app}
              onEdit={() => setAction('edit')}
              onDeployment={() => setAction('deployment')}
              onDelete={() => setAction('delete')}
            />
          )}
        </div>
      </div>
      {renderFrameArea()}
      <FloatingFeedbackButton appUid={app.uid} appName={app.name} />
      {showDetails && (
        <AiAppDetailsModal
          isOpen
          uid={app.uid}
          appName={app.name}
          prdUrl={app.prd as string}
          onClose={() => setShowDetails(false)}
        />
      )}
      {action === 'edit' && <EditAiAppModal app={app} onClose={() => setAction(null)} />}
      {action === 'deployment' && (
        <DeploymentSettingsModal app={app} onClose={() => setAction(null)} onDeployingChange={setIsRedeploying} />
      )}
      {action === 'delete' && (
        <DeleteAiAppDialog
          app={app}
          onClose={() => setAction(null)}
          onDeleteSucceeded={() => router.push('/pl-infra/ai-apps')}
        />
      )}
    </div>
  );
}
