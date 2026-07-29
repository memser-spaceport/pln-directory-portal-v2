/**
 * Stateless mock for the AI Apps `deployment` field (contract agreed, backend
 * pending — LAB-2101 family). Real API responses are DECORATED: each app's
 * state is a pure function of its uid, so the list and detail endpoints agree
 * by construction and nothing flickers across refetches.
 *
 * Only `ai-apps.service.ts` may import this module, and only lazily inside
 * `AI_APPS_DEPLOYMENT_MOCK` branches, so production builds never reach it.
 * Delete this file (and its call sites) at API cutover.
 *
 * Pass-throughs (all deliberate):
 * - apps that already carry `deployment` — when the backend starts sending real
 *   data in dev, the mock self-retires instead of masking it;
 * - apps whose real status is DRAFT or DEPLOYING — forcing ERROR over a live
 *   DEPLOYING app stops the list poll and permanently strands the settings
 *   modal's deploy-observation machine in a spinner.
 * `updatedAt` is never touched (it keys the detail iframe remount + probe).
 *
 * Known sharp edges under mock: retrying a mocked-ERROR app fires a REAL
 * POST /deploy against the dev API, and the refetch re-applies ERROR — the
 * settings modal then sits in a permanent 'deploying' spinner (close it
 * manually). Retry testing requires the flag off.
 */
import type { AiApp, AiAppDeploymentInfo } from './ai-apps.service';

/** djb2 — tiny, deterministic, good-enough spread for bucketing dev fleets. */
function hashUid(uid: string): number {
  let hash = 5381;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 33) ^ uid.charCodeAt(i);
  }
  return hash >>> 0;
}

type MockBucket = 'warning' | 'danger' | 'legacy' | 'untouched';

const BUCKETS: MockBucket[] = ['warning', 'danger', 'legacy', 'untouched'];

function bucketFor(uid: string): MockBucket {
  return BUCKETS[hashUid(uid) % BUCKETS.length];
}

/** No real data — plain fixture strings only (the lazy chunk may still emit as an orphan asset). */
const MOCK_DEPLOYMENT: Record<'warning' | 'danger', AiAppDeploymentInfo> = {
  warning: {
    serving: 'previous',
    failureReason: 'New revision never became healthy — rolled back to the previous one.',
    failureStream: 'runtime',
  },
  danger: {
    serving: 'none',
    failureReason: 'Build failed — no image produced.',
    failureStream: 'build',
  },
};

/**
 * Returns a decorated COPY; the input is never mutated (it may live in the
 * React Query cache). Structural sharing collapses deep-equal copies back to
 * stable references across refetches — don't "optimize" either half away.
 */
export function decorateApp(app: AiApp): AiApp {
  if (app.deployment || app.status === 'DRAFT' || app.status === 'DEPLOYING') {
    return app;
  }
  switch (bucketFor(app.uid)) {
    case 'warning':
      return { ...app, status: 'ERROR', deployment: { ...MOCK_DEPLOYMENT.warning } };
    case 'danger':
      return { ...app, status: 'ERROR', deployment: { ...MOCK_DEPLOYMENT.danger } };
    case 'legacy':
      // ERROR without `deployment` — exercises the mixed-fleet fallthrough.
      return { ...app, status: 'ERROR' };
    default:
      return app;
  }
}

export function decorateApps(apps: AiApp[]): AiApp[] {
  return apps.map(decorateApp);
}
