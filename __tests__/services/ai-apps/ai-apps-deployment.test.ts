import { AiApp, AiAppStatus, AiAppServing, deployFailureKind } from '@/services/ai-apps/ai-apps.service';
import { decorateApp, decorateApps } from '@/services/ai-apps/ai-apps-deployment.mock-data';

function buildApp(overrides: Partial<AiApp> = {}): AiApp {
  return {
    uid: 'app-1',
    memberUid: 'member-1',
    appId: 'news-summarizer',
    name: 'News Summarizer',
    description: 'Summarize recent news.',
    status: 'READY',
    notes: null,
    url: null,
    httpUrl: null,
    host: null,
    port: null,
    deploymentId: 'deploy-1',
    requiredEnvVars: [],
    providedEnvVars: [],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    member: { uid: 'member-1', name: 'Ada', image: null },
    ...overrides,
  };
}

describe('deployFailureKind', () => {
  // The full status × serving matrix — the blanket rule ("anything outside the
  // two defined ERROR states behaves as legacy/absent") is proven here once,
  // not via DOM assertions across component tests.
  const matrix: Array<[AiAppStatus, AiAppServing | 'absent' | 'unknown', ReturnType<typeof deployFailureKind>]> = [
    ['ERROR', 'previous', 'warning'],
    ['ERROR', 'none', 'danger'],
    ['ERROR', 'latest', 'legacy'],
    ['ERROR', 'absent', 'legacy'],
    ['ERROR', 'unknown', 'legacy'],
    ['READY', 'previous', null],
    ['READY', 'none', null],
    ['READY', 'absent', null],
    ['DEPLOYING', 'none', null],
    ['DEPLOYING', 'absent', null],
    ['DRAFT', 'previous', null],
    ['DRAFT', 'absent', null],
  ];

  it.each(matrix)('status=%s serving=%s → %s', (status, serving, expected) => {
    const deployment = serving === 'absent' ? undefined : { serving: serving as AiAppServing };
    expect(deployFailureKind({ status, deployment })).toBe(expected);
  });
});

describe('ai-apps deployment mock decorators', () => {
  it('never mutates its input (React Query cache contract)', () => {
    const app = buildApp();
    const snapshot = JSON.parse(JSON.stringify(app));

    decorateApp(app);

    expect(app).toEqual(snapshot);
  });

  it('list and detail decoration agree for the same uid', () => {
    const apps = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((uid) => buildApp({ uid }));

    const fromList = decorateApps(apps);
    for (const [index, app] of apps.entries()) {
      expect(decorateApp(app)).toEqual(fromList[index]);
    }
  });

  it('is deterministic across repeated calls', () => {
    const app = buildApp({ uid: 'stable-uid' });
    expect(decorateApp(app)).toEqual(decorateApp(app));
  });

  it('passes through apps that already carry real deployment data', () => {
    const app = buildApp({ status: 'ERROR', deployment: { serving: 'previous' } });
    expect(decorateApp(app)).toBe(app);
  });

  it('passes through DRAFT and DEPLOYING apps untouched', () => {
    const draft = buildApp({ status: 'DRAFT' });
    const deploying = buildApp({ status: 'DEPLOYING' });
    expect(decorateApp(draft)).toBe(draft);
    expect(decorateApp(deploying)).toBe(deploying);
  });

  it('never forces DEPLOYING and never touches updatedAt', () => {
    const apps = Array.from({ length: 32 }, (_, i) => buildApp({ uid: `app-${i}` }));

    for (const decorated of decorateApps(apps)) {
      expect(decorated.status).not.toBe('DEPLOYING');
      expect(decorated.updatedAt).toBe('2026-07-01T00:00:00.000Z');
    }
  });

  it('a decorated ERROR app always classifies to a defined kind', () => {
    const apps = Array.from({ length: 32 }, (_, i) => buildApp({ uid: `app-${i}` }));

    for (const decorated of decorateApps(apps)) {
      if (decorated.status === 'ERROR') {
        expect(['warning', 'danger', 'legacy']).toContain(deployFailureKind(decorated));
      } else {
        expect(deployFailureKind(decorated)).toBeNull();
      }
    }
  });
});
