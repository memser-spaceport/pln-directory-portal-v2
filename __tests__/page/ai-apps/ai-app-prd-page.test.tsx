import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { AiAppPrdPage } from '@/components/page/ai-apps/AiAppPrdPage';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

let mockUseAiAppReturn: { app: AiApp | null; errorKind: string | null; isLoading: boolean };
jest.mock('@/services/ai-apps/hooks/useAiApp', () => ({
  useAiApp: () => mockUseAiAppReturn,
}));

let mockUseAiAppPrdContentReturn: { content: string | null; error: string | null; isLoading: boolean };
jest.mock('@/services/ai-apps/hooks/useAiAppPrdContent', () => ({
  useAiAppPrdContent: () => mockUseAiAppPrdContentReturn,
}));

const mockAnalytics = { onPrdPageViewed: jest.fn() };
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

jest.mock('@/components/page/ai-apps/components/PrdViewerBody', () => ({
  PrdViewerBody: ({ isLoading, error, content }: { isLoading: boolean; error: string | null; content: string | null }) => (
    <div data-testid="prd-viewer-body">{isLoading ? 'loading' : error ?? content}</div>
  ),
}));

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

describe('AiAppPrdPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while the app is loading', () => {
    mockUseAiAppReturn = { app: null, errorKind: null, isLoading: true };
    mockUseAiAppPrdContentReturn = idlePrdQuery;

    render(<AiAppPrdPage uid="app-1" />);

    expect(screen.getByTestId('prd-viewer-body')).toHaveTextContent('loading');
  });

  it.each(['not-found', 'forbidden'])('collapses %s into a generic "not found" message', (errorKind) => {
    mockUseAiAppReturn = { app: null, errorKind, isLoading: false };
    mockUseAiAppPrdContentReturn = idlePrdQuery;

    render(<AiAppPrdPage uid="app-1" />);

    expect(screen.getByText('This app could not be found.')).toBeInTheDocument();
  });

  it('shows a distinct message for a network error', () => {
    mockUseAiAppReturn = { app: null, errorKind: 'network', isLoading: false };
    mockUseAiAppPrdContentReturn = idlePrdQuery;

    render(<AiAppPrdPage uid="app-1" />);

    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('shows a distinct empty state when the app has no prd', () => {
    mockUseAiAppReturn = { app: buildApp({ prd: null }), errorKind: null, isLoading: false };
    mockUseAiAppPrdContentReturn = idlePrdQuery;

    render(<AiAppPrdPage uid="app-1" />);

    expect(screen.getByText('This app no longer has a one-pager.')).toBeInTheDocument();
  });

  it('shows a loading indicator while the prd content is loading', () => {
    mockUseAiAppReturn = { app: buildApp(), errorKind: null, isLoading: false };
    mockUseAiAppPrdContentReturn = { content: null, error: null, isLoading: true };

    render(<AiAppPrdPage uid="app-1" />);

    expect(screen.getByTestId('prd-viewer-body')).toHaveTextContent('loading');
  });

  it('shows the prd content error via PrdViewerBody', () => {
    mockUseAiAppReturn = { app: buildApp(), errorKind: null, isLoading: false };
    mockUseAiAppPrdContentReturn = { content: null, error: 'One-pager could not be loaded', isLoading: false };

    render(<AiAppPrdPage uid="app-1" />);

    expect(screen.getByTestId('prd-viewer-body')).toHaveTextContent('One-pager could not be loaded');
  });

  it('renders the content and fires onPrdPageViewed once on success, with no other chrome', () => {
    mockUseAiAppReturn = { app: buildApp(), errorKind: null, isLoading: false };
    mockUseAiAppPrdContentReturn = { content: '# Hello', error: null, isLoading: false };

    const { rerender } = render(<AiAppPrdPage uid="app-1" />);

    expect(screen.getByTestId('prd-viewer-body')).toHaveTextContent('# Hello');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(mockAnalytics.onPrdPageViewed).toHaveBeenCalledTimes(1);
    expect(mockAnalytics.onPrdPageViewed).toHaveBeenCalledWith('app-1', 'News Summarizer');

    rerender(<AiAppPrdPage uid="app-1" />);
    expect(mockAnalytics.onPrdPageViewed).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPrdPageViewed for the error/no-prd states', () => {
    mockUseAiAppReturn = { app: buildApp({ prd: null }), errorKind: null, isLoading: false };
    mockUseAiAppPrdContentReturn = idlePrdQuery;

    render(<AiAppPrdPage uid="app-1" />);

    expect(mockAnalytics.onPrdPageViewed).not.toHaveBeenCalled();
  });
});
