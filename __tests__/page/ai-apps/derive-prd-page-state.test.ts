import { derivePrdPageState } from '@/components/page/ai-apps/AiAppPrdPage/derivePrdPageState';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

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
    prd: 'https://bucket.s3.us-east-1.amazonaws.com/ai-app-prds/app-1.md',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    member: { uid: 'member-1', name: 'Ada', image: null },
    ...overrides,
  };
}

const idlePrdQuery = { content: null, error: null, isLoading: false };

describe('derivePrdPageState', () => {
  it('is "loading" while the app query is loading, regardless of the prd query', () => {
    expect(derivePrdPageState({ app: null, errorKind: null, isLoading: true }, idlePrdQuery)).toEqual({
      status: 'loading',
    });
  });

  it.each(['not-found', 'forbidden', 'network'] as const)('is "app-error" with errorKind %s', (errorKind) => {
    expect(derivePrdPageState({ app: null, errorKind, isLoading: false }, idlePrdQuery)).toEqual({
      status: 'app-error',
      errorKind,
    });
  });

  it('is "no-prd" when the app loaded but has no prd', () => {
    expect(
      derivePrdPageState({ app: buildApp({ prd: null }), errorKind: null, isLoading: false }, idlePrdQuery),
    ).toEqual({ status: 'no-prd' });
  });

  it('is "no-prd" when prd is an empty/whitespace-only string', () => {
    expect(
      derivePrdPageState({ app: buildApp({ prd: '   ' }), errorKind: null, isLoading: false }, idlePrdQuery),
    ).toEqual({ status: 'no-prd' });
  });

  it('is "prd-loading" once the app has a prd but its content is still loading', () => {
    expect(
      derivePrdPageState(
        { app: buildApp(), errorKind: null, isLoading: false },
        { content: null, error: null, isLoading: true },
      ),
    ).toEqual({ status: 'prd-loading' });
  });

  it('is "prd-error" with a default message when the content query errors with no message', () => {
    expect(
      derivePrdPageState(
        { app: buildApp(), errorKind: null, isLoading: false },
        { content: null, error: null, isLoading: false },
      ),
    ).toEqual({ status: 'prd-error', error: 'One-pager could not be loaded' });
  });

  it('is "prd-error" preserving a specific error message', () => {
    expect(
      derivePrdPageState(
        { app: buildApp(), errorKind: null, isLoading: false },
        { content: null, error: 'Custom failure', isLoading: false },
      ),
    ).toEqual({ status: 'prd-error', error: 'Custom failure' });
  });

  it('is "ready" with the content once everything resolved successfully', () => {
    expect(
      derivePrdPageState(
        { app: buildApp(), errorKind: null, isLoading: false },
        { content: '# Hello', error: null, isLoading: false },
      ),
    ).toEqual({ status: 'ready', prd: '# Hello' });
  });
});
