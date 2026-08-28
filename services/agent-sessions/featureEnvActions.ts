import type { AgentSession } from '@/services/agent-sessions/agent-sessions.service';

/**
 * Whether the Deploy button should be offered.
 *
 * Deliberately an allowlist: deploying is a *create* action, and offering it while
 * an environment is mid-flight risks a double deploy. An unrecognised status is
 * therefore treated as "something is happening, stay out of the way".
 */
export function canDeployFeatureEnv(session: AgentSession): boolean {
  if (!session.pull_request_url || !session.working_branch) return false;

  const status = session.feature_environment_status;
  if (!status || status === 'deleted' || status === 'failed' || status === 'cancelled' || status === 'cleanup_failed') {
    return true;
  }

  // `ready` means an environment exists and this is a redeploy.
  return status === 'ready';
}

/**
 * Whether the Delete button should be offered.
 *
 * Deliberately a denylist, and the inverse of the rule above. There are only two
 * reasons deletion cannot apply: there is no environment, or it is already gone.
 * Every other state — including a failed or half-deleted one — is something an
 * admin may legitimately want to tear down.
 *
 * This used to be an allowlist of statuses, which silently hid the button for any
 * state nobody had thought of. It listed `dispatching`, `in_progress`, `queued` and
 * `cleanup_pending` (none of which the orchestrator emits) while missing
 * `dispatched` (which it does), so a dispatched environment could not be deleted
 * from the UI at all. The backend is the real authority here and rejects a delete
 * it does not permit, so guessing the vocabulary bought nothing.
 */
export function canDeleteFeatureEnv(session: AgentSession): boolean {
  const status = session.feature_environment_status;
  return Boolean(status) && status !== 'deleted';
}
