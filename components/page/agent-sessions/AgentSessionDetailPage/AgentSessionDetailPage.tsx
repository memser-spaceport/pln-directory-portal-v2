'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canAdminAgentSessions } from '@/services/rbac/utils/agentSessions/canAdminAgentSessions';
import { useAgentSession } from '@/services/agent-sessions/hooks/useAgentSession';
import { useAgentSessionProgress } from '@/services/agent-sessions/hooks/useAgentSessionProgress';
import {
  useDeleteAgentSessionFeatureEnv,
  useDeployAgentSessionFeatureEnv,
} from '@/services/agent-sessions/hooks/useAgentSessionFeatureEnv';
import {
  deriveProgressSteps,
  type DerivedStepPhase,
} from '@/services/agent-sessions/deriveProgressSteps';
import type { AgentSession } from '@/services/agent-sessions/agent-sessions.service';
import { AgentSessionChat } from '../AgentSessionChat';
import { formatDate, SessionStatusBadge } from '../shared/sessionStatus';
import s from '../shared/AgentSessions.module.scss';

type DetailTab = 'overview' | 'chat';

const ACTIVE_FEATURE_ENV_STATUSES = new Set([
  'queued',
  'cleanup_pending',
  'dispatching',
  'in_progress',
  'deploying',
  'ready',
  'deleting',
]);

const STEP_DOT_CLASS: Record<DerivedStepPhase, string> = {
  pending: '',
  active: s.stepDotActive,
  completed: s.stepDotCompleted,
  failed: s.stepDotFailed,
  cancelled: s.stepDotFailed,
  skipped: s.stepDotSkipped,
};

function featureEnvUrlFromProgress(progress: ReturnType<typeof useAgentSessionProgress>['data']): string | null {
  const urls = progress?.terminal?.metadata?.urls as Record<string, unknown> | undefined;
  if (urls && typeof urls.frontend === 'string') return urls.frontend;
  const readyStep = progress?.steps.find((step) => step.key === 'feature_ready' && step.reached);
  const readyUrls = readyStep?.metadata?.urls as Record<string, unknown> | undefined;
  if (readyUrls && typeof readyUrls.frontend === 'string') return readyUrls.frontend;
  return null;
}

function canDeployFeatureEnv(session: AgentSession) {
  if (!session.pull_request_url || !session.working_branch) return false;
  const status = session.feature_environment_status;
  if (!status || status === 'deleted' || status === 'failed' || status === 'cancelled' || status === 'cleanup_failed') {
    return true;
  }
  return status === 'ready';
}

function canDeleteFeatureEnv(session: AgentSession) {
  const status = session.feature_environment_status;
  if (!status || status === 'deleted') return false;
  return ACTIVE_FEATURE_ENV_STATUSES.has(status) || status === 'failed' || status === 'cancelled' || status === 'cleanup_failed';
}

export function AgentSessionDetailPage({ sessionId }: { sessionId: string }) {
  const { permsSet } = usePermissions();
  const canAdmin = canAdminAgentSessions(permsSet);
  const sessionQuery = useAgentSession(sessionId);
  const progressQuery = useAgentSessionProgress(sessionId);
  const deployMutation = useDeployAgentSessionFeatureEnv(sessionId);
  const deleteMutation = useDeleteAgentSessionFeatureEnv(sessionId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const session = sessionQuery.data;
  const progress = progressQuery.data;
  const derivedSteps = useMemo(
    () => deriveProgressSteps(progress?.steps ?? [], progress?.status ?? session?.status),
    [progress?.steps, progress?.status, session?.status],
  );
  const featureEnvUrl = session?.feature_environment_url || featureEnvUrlFromProgress(progress);
  const busy = deployMutation.isPending || deleteMutation.isPending;

  const handleDeploy = async (force = false) => {
    setActionError(null);
    try {
      await deployMutation.mutateAsync({ force });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to deploy feature environment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this feature environment? The PR and branch will be kept.')) {
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync({});
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to delete feature environment');
    }
  };

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        {/* Back link, identity and tabs travel together: the tabs are page chrome,
            and leaving them to scroll out from under a pinned title reads as broken. */}
        <div className={s.stickyHeader}>
          <Link href="/pl-infra/agent-sessions" className={s.backLink}>
            ← Back to sessions
          </Link>

          <div className={s.header}>
            <div className={s.titleBlock}>
              <h1 className={s.title}>Agent Session</h1>
              <p className={s.description}>{sessionId}</p>
            </div>
            {session ? <SessionStatusBadge status={session.status} /> : null}
          </div>

          {/* Chat is admin-only: a message starts a new agent run, so a VIEW-only
              user gets no tab bar at all rather than a read-only thread. */}
          {canAdmin ? (
            <div className={s.tabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'overview'}
                className={`${s.tab} ${activeTab === 'overview' ? s.tabActive : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'chat'}
                className={`${s.tab} ${activeTab === 'chat' ? s.tabActive : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
            </div>
          ) : null}
        </div>

        {(sessionQuery.isLoading || progressQuery.isLoading) && !session ? (
          <div className={s.panel}>
            <p className={s.state}>Loading session…</p>
          </div>
        ) : null}

        {sessionQuery.isError ? (
          <div className={s.panel}>
            <p className={`${s.state} ${s.error}`}>
              {sessionQuery.error instanceof Error ? sessionQuery.error.message : 'Failed to load session'}
            </p>
          </div>
        ) : null}

        {/* Mounted only while its tab is active, so the messages poll stops when
            the admin is looking at Overview. */}
        {canAdmin && activeTab === 'chat' ? <AgentSessionChat sessionId={sessionId} session={session} /> : null}

        {session && activeTab === 'overview' ? (
          <>
            <div className={s.panel}>
              <h2 className={s.sectionTitle}>Overview</h2>
              <div className={s.metaGrid}>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Repository</span>
                  <span className={s.metaValue}>{session.repository_key}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Base branch</span>
                  <span className={s.metaValue}>{session.base_branch}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Working branch</span>
                  <span className={s.metaValue}>{session.working_branch || '—'}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Requested by</span>
                  <span className={s.metaValue}>{session.requested_by || '—'}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Created</span>
                  <span className={s.metaValue}>{formatDate(session.created_at)}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Updated</span>
                  <span className={s.metaValue}>{formatDate(session.updated_at)}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Pull request</span>
                  <span className={s.metaValue}>
                    {session.pull_request_url ? (
                      <a className={s.externalLink} href={session.pull_request_url} target="_blank" rel="noreferrer">
                        {session.pull_request_url}
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Feature environment</span>
                  <span className={s.metaValue}>
                    {featureEnvUrl ? (
                      <a className={s.externalLink} href={featureEnvUrl} target="_blank" rel="noreferrer">
                        {featureEnvUrl}
                      </a>
                    ) : (
                      session.feature_environment_status || '—'
                    )}
                  </span>
                </div>
              </div>

              {canAdmin ? (
                <div className={s.featureEnvActions}>
                  {canDeployFeatureEnv(session) ? (
                    <button
                      type="button"
                      className={s.primaryButton}
                      disabled={busy}
                      onClick={() => handleDeploy(session.feature_environment_status === 'ready')}
                    >
                      {deployMutation.isPending
                        ? 'Deploying…'
                        : session.feature_environment_status === 'ready'
                          ? 'Redeploy feature env'
                          : 'Deploy feature env'}
                    </button>
                  ) : null}
                  {canDeleteFeatureEnv(session) ? (
                    <button
                      type="button"
                      className={s.dangerButton}
                      disabled={busy}
                      onClick={handleDelete}
                    >
                      {deleteMutation.isPending ? 'Deleting…' : 'Delete feature env'}
                    </button>
                  ) : null}
                  {!session.pull_request_url ? (
                    <span className={s.muted}>Feature env actions unlock after the PR is created.</span>
                  ) : null}
                </div>
              ) : null}

              {actionError ? <p className={`${s.state} ${s.error}`}>{actionError}</p> : null}
              {session.error_message ? <p className={`${s.state} ${s.error}`}>{session.error_message}</p> : null}

              <h2 className={s.sectionTitle}>Prompt</h2>
              <pre className={s.promptBox}>{session.prompt}</pre>
            </div>

            <div className={s.panel}>
              <h2 className={s.sectionTitle}>Progress</h2>
              {progressQuery.isError ? (
                <p className={`${s.state} ${s.error}`}>
                  {progressQuery.error instanceof Error ? progressQuery.error.message : 'Failed to load progress'}
                </p>
              ) : null}
              {derivedSteps.length ? (
                <ol className={s.steps}>
                  {derivedSteps.map((step) => (
                    <li key={step.key} className={s.step}>
                      <span className={`${s.stepDot} ${STEP_DOT_CLASS[step.phase]}`} aria-hidden />
                      <div className={s.stepBody}>
                        <span className={s.stepKey}>
                          {step.key.replace(/_/g, ' ')} · {step.displayStatus}
                        </span>
                        {step.message ? <span className={s.stepMessage}>{step.message}</span> : null}
                        {step.createdAt ? <span className={s.stepMeta}>{formatDate(step.createdAt)}</span> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={s.state}>No progress events yet.</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
