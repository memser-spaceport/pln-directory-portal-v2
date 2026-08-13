'use client';

import Link from 'next/link';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canAdminAgentSessions } from '@/services/rbac/utils/agentSessions/canAdminAgentSessions';
import { useAgentSessions } from '@/services/agent-sessions/hooks/useAgentSessions';
import { formatDate, SessionStatusBadge } from '../shared/sessionStatus';
import s from '../shared/AgentSessions.module.scss';

export function AgentSessionsPage() {
  const { permsSet } = usePermissions();
  const canAdmin = canAdminAgentSessions(permsSet);
  const { data, isLoading, isError, error } = useAgentSessions();

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <div className={s.header}>
          <div className={s.titleBlock}>
            <h1 className={s.title}>Agent Sessions</h1>
            <p className={s.description}>
              Create and track autonomous coding sessions — status, pull requests, and feature environments.
            </p>
          </div>
          {canAdmin ? (
            <Link href="/pl-infra/agent-sessions/new" className={s.primaryButton}>
              New session
            </Link>
          ) : null}
        </div>

        <div className={s.panel}>
          {isLoading ? <p className={s.state}>Loading sessions…</p> : null}
          {isError ? (
            <p className={`${s.state} ${s.error}`}>
              {error instanceof Error ? error.message : 'Failed to load sessions'}
            </p>
          ) : null}
          {!isLoading && !isError && (data?.length ?? 0) === 0 ? (
            <p className={s.state}>No agent sessions yet.</p>
          ) : null}
          {!isLoading && !isError && data && data.length > 0 ? (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Repository</th>
                  <th>Requested by</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <SessionStatusBadge status={session.status} />
                    </td>
                    <td>
                      <div>{session.repository_key}</div>
                      <div className={s.muted}>{session.base_branch}</div>
                    </td>
                    <td>{session.requested_by || '—'}</td>
                    <td>{formatDate(session.created_at)}</td>
                    <td>
                      <Link href={`/pl-infra/agent-sessions/${session.id}`} className={s.rowLink}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  );
}
