import s from './AgentSessions.module.scss';

const STATUS_CLASS: Record<string, string> = {
  ready: s.statusReady,
  failed: s.statusFailed,
  cancelled: s.statusCancelled,
  deploying: s.statusDeploying,
  running: s.statusRunning,
  starting: s.statusStarting,
  cloning: s.statusCloning,
  testing: s.statusTesting,
  pushing: s.statusPushing,
  pr_created: s.statusPr_created,
  queued: s.statusQueued,
};

export function SessionStatusBadge({ status }: { status: string }) {
  const className = STATUS_CLASS[status] ?? '';
  return <span className={`${s.status} ${className}`}>{status}</span>;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
