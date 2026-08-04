'use client';

import Link from 'next/link';
import { useAgentSession } from '@/services/agent-sessions/hooks/useAgentSession';
import { useAgentSessionProgress } from '@/services/agent-sessions/hooks/useAgentSessionProgress';
import { formatDate, SessionStatusBadge } from '../shared/sessionStatus';
import s from '../shared/AgentSessions.module.scss';

function stepDotClass(status: string, reached: boolean) {
  if (status === 'failed' || status === 'cancelled') return s.stepDotFailed;
  if (status === 'ready') return s.stepDotReady;
  if (reached) return s.stepDotReached;
  return '';
}

function featureEnvUrlFromProgress(progress: ReturnType<typeof useAgentSessionProgress>['data']): string | null {
  const urls = progress?.terminal?.metadata?.urls as Record<string, unknown> | undefined;
  if (urls && typeof urls.frontend === 'string') return urls.frontend;
  const readyStep = progress?.steps.find((step) => step.key === 'feature_ready' && step.reached);
  const readyUrls = readyStep?.metadata?.urls as Record<string, unknown> | undefined;
  if (readyUrls && typeof readyUrls.frontend === 'string') return readyUrls.frontend;
  return null;
}

export function AgentSessionDetailPage({ sessionId }: { sessionId: string }) {
  const sessionQuery = useAgentSession(sessionId);
  const progressQuery = useAgentSessionProgress(sessionId);

  const session = sessionQuery.data;
  const progress = progressQuery.data;
  const featureEnvUrl = session?.feature_environment_url || featureEnvUrlFromProgress(progress);

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
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

        {session ? (
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
              {progress?.steps?.length ? (
                <ol className={s.steps}>
                  {progress.steps.map((step) => (
                    <li key={step.key} className={s.step}>
                      <span className={`${s.stepDot} ${stepDotClass(step.status, step.reached)}`} aria-hidden />
                      <div className={s.stepBody}>
                        <span className={s.stepKey}>
                          {step.key.replace(/_/g, ' ')}
                          {step.reached ? ` · ${step.status}` : ' · pending'}
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
