import type { AgentSessionProgressStep } from '@/services/agent-sessions/agent-sessions.service';

export type DerivedStepPhase = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled' | 'skipped';

export type DerivedProgressStep = AgentSessionProgressStep & {
  phase: DerivedStepPhase;
  displayStatus: string;
};

const FAILURE_STATUSES = new Set(['failed', 'cancelled']);

/** Steps whose event is a completion milestone (not an in-progress "started" marker). */
const COMPLETION_STATUSES = new Set(['ready', 'pr_created', 'deleted']);

/**
 * Orchestrator progress steps store the *task* status at event time (e.g. "running",
 * "pushing"). There are generally no per-step completion events — the next
 * `*.started` / milestone implies the previous step finished.
 *
 * Derive UI phases from step order + reached flags. See
 * code-fix-orchestrator `GET /v1/tasks/:id/progress` step definitions.
 */
export function deriveProgressSteps(
  steps: AgentSessionProgressStep[],
  overallStatus?: string | null,
): DerivedProgressStep[] {
  const lastReachedIndex = findLastIndex(steps, (step) => step.reached);
  const overallFailed = overallStatus === 'failed' || overallStatus === 'cancelled';

  return steps.map((step, index) => {
    if (FAILURE_STATUSES.has(step.status)) {
      return withPhase(step, step.status as 'failed' | 'cancelled', step.status);
    }

    if (step.status === 'skipped') {
      return withPhase(step, 'skipped', 'skipped');
    }

    if (!step.reached) {
      // Later feature steps can exist without feature_job.created (e.g. recreated/
      // force_recreated event types). Treat gaps before a later reached step as skipped.
      if (lastReachedIndex > index) {
        return withPhase(step, 'skipped', 'skipped');
      }
      return withPhase(step, 'pending', 'pending');
    }

    const laterStepReached = lastReachedIndex > index;
    if (laterStepReached) {
      return withPhase(step, 'completed', 'completed');
    }

    // Failure events (code_change.failed, etc.) are often not mapped onto a step;
    // surface overall failure on the last reached step.
    if (overallFailed) {
      return withPhase(step, overallStatus as 'failed' | 'cancelled', overallStatus!);
    }

    // Last reached step: completion milestones are done; started-markers are active.
    if (COMPLETION_STATUSES.has(step.status) || step.key === 'feature_ready') {
      return withPhase(step, 'completed', step.status === 'ready' ? 'ready' : 'completed');
    }

    return withPhase(step, 'active', step.status);
  });
}

function withPhase(
  step: AgentSessionProgressStep,
  phase: DerivedStepPhase,
  displayStatus: string,
): DerivedProgressStep {
  return { ...step, phase, displayStatus };
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (predicate(items[i])) return i;
  }
  return -1;
}
