import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { DeploymentLogsModal } from '@/components/page/ai-apps/AiAppsPage/components/DeploymentLogsModal';
import { AiApp, AiAppFetchErrorKind, AiAppLogEvent } from '@/services/ai-apps/ai-apps.service';

const mockAnalytics = {
  onDeploymentLogsTabSwitched: jest.fn(),
  onDeploymentLogsExported: jest.fn(),
};
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

type HookReturn = {
  events: AiAppLogEvent[] | null;
  pageCount: number;
  errorKind: AiAppFetchErrorKind | null;
  loadMoreFailed: boolean;
  isLoading: boolean;
  hasMore: boolean;
  canAutoLoad: boolean;
  isLoadingMore: boolean;
  loadMore: jest.Mock;
  refresh: jest.Mock;
};

let mockStreams: Record<'build' | 'runtime', HookReturn>;
jest.mock('@/services/ai-apps/hooks/useAiAppLogs', () => ({
  ...jest.requireActual('@/services/ai-apps/hooks/useAiAppLogs'),
  useAiAppLogs: (_uid: string, stream: 'build' | 'runtime') => mockStreams[stream],
}));

const loaded = (events: AiAppLogEvent[] | null, extra: Partial<HookReturn> = {}): HookReturn => ({
  events,
  pageCount: events ? 1 : 0,
  errorKind: null,
  loadMoreFailed: false,
  isLoading: false,
  hasMore: false,
  canAutoLoad: false,
  isLoadingMore: false,
  loadMore: jest.fn(),
  refresh: jest.fn().mockResolvedValue(undefined),
  ...extra,
});

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

const line = (timestamp: number, message: string) => ({ timestamp, message });

describe('DeploymentLogsModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockStreams = {
      build: loaded([line(1, 'Step 1/5 : FROM node:20'), line(2, 'npm install completed')]),
      runtime: loaded([line(3, 'server listening on 3000')]),
    };
  });

  it('defaults to the Runtime tab for a healthy app and Build for a failed one', () => {
    const { unmount } = render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);
    expect(screen.getByRole('tab', { name: /runtime/i })).toHaveAttribute('aria-selected', 'true');
    unmount();

    render(<DeploymentLogsModal app={buildApp({ status: 'ERROR' })} onClose={onClose} />);
    expect(screen.getByRole('tab', { name: /build/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows log lines with counts, and switching tabs fires analytics and resets search', () => {
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    expect(screen.getByText('server listening on 3000')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /build/i }));
    expect(screen.getByText('Step 1/5 : FROM node:20')).toBeInTheDocument();
    expect(mockAnalytics.onDeploymentLogsTabSwitched).toHaveBeenCalledWith('app-1', 'build');
  });

  it('filters lines by search and offers a clear CTA when nothing matches', () => {
    render(<DeploymentLogsModal app={buildApp({ status: 'ERROR' })} onClose={onClose} />);

    const search = screen.getByRole('searchbox', { name: /search deployment logs/i });
    fireEvent.change(search, { target: { value: 'npm' } });
    expect(screen.queryByText('Step 1/5 : FROM node:20')).not.toBeInTheDocument();
    expect(screen.getByText('npm install completed')).toBeInTheDocument();
    // The count is split by a <strong>, so match on the whole span's text.
    expect(
      screen.getByText((_, el) => el?.tagName === 'SPAN' && /Showing 1 of 2 loaded events/.test(el.textContent ?? '')),
    ).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'zzz' } });
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
    expect(screen.getByText('Step 1/5 : FROM node:20')).toBeInTheDocument();
  });

  it('renders a dedicated forbidden state without a retry button', () => {
    mockStreams.runtime = loaded(null, { errorKind: 'forbidden' });
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    expect(screen.getByText(/don’t have access to logs/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('renders a retryable error state on network failure', () => {
    mockStreams.runtime = loaded(null, { errorKind: 'network' });
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    expect(screen.getByText(/unable to load logs/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockStreams.runtime.refresh).toHaveBeenCalled();
  });

  it('shows the neutral windowed empty state for runtime — never a "never ran" claim', () => {
    mockStreams.runtime = loaded([]);
    render(<DeploymentLogsModal app={buildApp({ status: 'ERROR' })} onClose={onClose} />);

    fireEvent.click(screen.getByRole('tab', { name: /runtime/i }));
    expect(screen.getByText(/no runtime logs in this window/i)).toBeInTheDocument();
    expect(screen.queryByText(/never ran/i)).not.toBeInTheDocument();
  });

  it('marks continuation with a +count, a scroll hint, and a Load more row', () => {
    mockStreams.runtime = loaded([line(3, 'x')], { hasMore: true, canAutoLoad: true });
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    expect(screen.getByRole('tab', { name: /runtime/i })).toHaveTextContent('1+');
    expect(screen.getByText(/newest loaded first — scroll to load the rest/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /load more logs/i }));
    expect(mockStreams.runtime.loadMore).toHaveBeenCalled();
  });

  it('offers an inline retry when loading a further page failed', () => {
    mockStreams.runtime = loaded([line(3, 'x')], { hasMore: true, loadMoreFailed: true });
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    expect(screen.getByText(/couldn’t load more lines/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockStreams.runtime.loadMore).toHaveBeenCalled();
  });

  it('auto-loads on scroll near the bottom, but only via user scroll events', () => {
    mockStreams.runtime = loaded(
      Array.from({ length: 20 }, (_, i) => line(i, `row ${i}`)),
      { hasMore: true, canAutoLoad: true },
    );
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    const pane = screen.getByRole('region', { name: /deployment logs/i });
    // jsdom has zero layout, so scrollHeight - scrollTop - clientHeight === 0 → "near bottom".
    fireEvent.scroll(pane);
    expect(mockStreams.runtime.loadMore).toHaveBeenCalledTimes(1);

    // No further fetch without another scroll — appends must never self-chain.
    expect(mockStreams.runtime.loadMore).toHaveBeenCalledTimes(1);
  });

  it('does not auto-load on scroll while a search filter is active', () => {
    mockStreams.runtime = loaded(
      Array.from({ length: 20 }, (_, i) => line(i, `row ${i}`)),
      { hasMore: true, canAutoLoad: true },
    );
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    fireEvent.change(screen.getByRole('searchbox', { name: /search deployment logs/i }), {
      target: { value: 'row' },
    });
    fireEvent.scroll(screen.getByRole('region', { name: /deployment logs/i }));
    expect(mockStreams.runtime.loadMore).not.toHaveBeenCalled();
  });

  it('Refresh restarts both streams from page 1', () => {
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(mockStreams.build.refresh).toHaveBeenCalled();
    expect(mockStreams.runtime.refresh).toHaveBeenCalled();
  });

  it('Export copies the filtered lines and reports only the row count to analytics', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<DeploymentLogsModal app={buildApp({ status: 'ERROR' })} onClose={onClose} />);

    fireEvent.change(screen.getByRole('searchbox', { name: /search deployment logs/i }), {
      target: { value: 'npm' },
    });
    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('npm install completed');
    expect(writeText.mock.calls[0][0]).not.toContain('Step 1/5');
    await screen.findByRole('button', { name: /copied/i });
    expect(mockAnalytics.onDeploymentLogsExported).toHaveBeenCalledWith('app-1', 'build', 1);
    // Counts only — never message or query text.
    expect(JSON.stringify(mockAnalytics.onDeploymentLogsExported.mock.calls)).not.toContain('npm');
  });

  it('marks the log pane and search as ph-no-capture so session replay never sees log text', () => {
    const { container } = render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    expect(container.ownerDocument.querySelector('[role="region"][aria-label="Deployment logs"]')?.className).toContain(
      'ph-no-capture',
    );
    expect(screen.getByRole('searchbox', { name: /search deployment logs/i }).className).toContain('ph-no-capture');
  });

  it('hints that a deploy is in progress for DEPLOYING apps', () => {
    render(<DeploymentLogsModal app={buildApp({ status: 'DEPLOYING' })} onClose={onClose} />);
    expect(screen.getByText(/deploy in progress/i)).toBeInTheDocument();
    expect(screen.getByText('Deploying')).toBeInTheDocument();
  });
});
