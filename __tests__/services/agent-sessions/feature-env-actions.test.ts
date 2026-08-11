import { canDeleteFeatureEnv, canDeployFeatureEnv } from '@/services/agent-sessions/featureEnvActions';
import type { AgentSession } from '@/services/agent-sessions/agent-sessions.service';

const session = (overrides: Partial<AgentSession> = {}): AgentSession =>
  ({
    id: 'task-1',
    pull_request_url: 'https://github.com/org/repo/pull/1',
    working_branch: 'agent/fix-task-1',
    feature_environment_status: null,
    ...overrides,
  }) as AgentSession;

describe('canDeployFeatureEnv', () => {
  it('needs a PR and a branch to deploy from', () => {
    expect(canDeployFeatureEnv(session({ pull_request_url: null }))).toBe(false);
    expect(canDeployFeatureEnv(session({ working_branch: null }))).toBe(false);
  });

  it.each([null, 'deleted', 'failed', 'cancelled', 'cleanup_failed'])(
    'offers a fresh deploy when the env is absent or finished (%s)',
    (status) => {
      expect(canDeployFeatureEnv(session({ feature_environment_status: status }))).toBe(true);
    },
  );

  it('offers a redeploy once the env is ready', () => {
    expect(canDeployFeatureEnv(session({ feature_environment_status: 'ready' }))).toBe(true);
  });

  // Allowlist on purpose: deploying twice over an in-flight env is worse than
  // withholding the button, so anything unrecognised is treated as in-flight.
  it.each(['deploying', 'dispatched', 'deleting', 'some_future_state'])(
    'withholds deploy while something is already happening (%s)',
    (status) => {
      expect(canDeployFeatureEnv(session({ feature_environment_status: status }))).toBe(false);
    },
  );
});

describe('canDeleteFeatureEnv', () => {
  it('has nothing to delete when no env exists', () => {
    expect(canDeleteFeatureEnv(session({ feature_environment_status: null }))).toBe(false);
  });

  it('has nothing to delete when the env is already gone', () => {
    expect(canDeleteFeatureEnv(session({ feature_environment_status: 'deleted' }))).toBe(false);
  });

  // The bug this replaced: `dispatched` is what the orchestrator actually emits
  // while a deploy is in flight, but the old allowlist spelled it `dispatching`,
  // so the Delete button vanished for exactly those sessions.
  it('offers delete for a dispatched env', () => {
    expect(canDeleteFeatureEnv(session({ feature_environment_status: 'dispatched' }))).toBe(true);
  });

  it.each(['deploying', 'ready', 'deleting', 'failed', 'cancelled', 'cleanup_failed'])(
    'offers delete for %s',
    (status) => {
      expect(canDeleteFeatureEnv(session({ feature_environment_status: status }))).toBe(true);
    },
  );

  // Denylist on purpose: the backend rejects a delete it does not permit, so an
  // unknown status must not silently hide the only way to clean up.
  it('offers delete for a status nobody has seen yet', () => {
    expect(canDeleteFeatureEnv(session({ feature_environment_status: 'quarantined' }))).toBe(true);
  });

  it('does not depend on the PR or branch, unlike deploy', () => {
    expect(
      canDeleteFeatureEnv(
        session({ pull_request_url: null, working_branch: null, feature_environment_status: 'ready' }),
      ),
    ).toBe(true);
  });
});
