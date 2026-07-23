import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { DeploymentLogsModal } from '@/components/page/ai-apps/AiAppsPage/components/DeploymentLogsModal';
import { AiApp, FetchAiAppLogsResult } from '@/services/ai-apps/ai-apps.service';

const mockAnalytics = {
  onDeploymentLogsTabSwitched: jest.fn(),
  onDeploymentLogsExported: jest.fn(),
};
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

type HookReturn = {
  result: FetchAiAppLogsResult | null;
  isLoading: boolean;
  isRefetching: boolean;
  isError: boolean;
  refetch: jest.Mock;
};

let mockStreams: Record<'build' | 'runtime', HookReturn>;
jest.mock('@/services/ai-apps/hooks/useAiAppLogs', () => ({
  ...jest.requireActual('@/services/ai-apps/hooks/useAiAppLogs'),
  useAiAppLogs: (_uid: string, stream: 'build' | 'runtime') => mockStreams[stream],
}));

const loaded = (
  events: FetchAiAppLogsResult['events'],
  termination: FetchAiAppLogsResult['termination'] = { reason: 'complete' },
): HookReturn => ({
  result: { events, termination },
  isLoading: false,
  isRefetching: false,
  isError: false,
  refetch: jest.fn(),
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
    expect(screen.getByText(/1 of 2 lines/)).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'zzz' } });
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
    expect(screen.getByText('Step 1/5 : FROM node:20')).toBeInTheDocument();
  });

  it('renders a dedicated forbidden state without a retry button', () => {
    mockStreams.runtime = loaded([], { reason: 'failed', errorKind: 'forbidden' });
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    expect(screen.getByText(/don’t have access to logs/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('renders a retryable error state on network failure', () => {
    mockStreams.runtime = loaded([], { reason: 'failed', errorKind: 'network' });
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    expect(screen.getByText(/unable to load logs/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockStreams.runtime.refetch).toHaveBeenCalled();
  });

  it('shows the neutral windowed empty state for runtime — never a "never ran" claim', () => {
    mockStreams.runtime = loaded([]);
    render(<DeploymentLogsModal app={buildApp({ status: 'ERROR' })} onClose={onClose} />);

    fireEvent.click(screen.getByRole('tab', { name: /runtime/i }));
    expect(screen.getByText(/no runtime logs in this window/i)).toBeInTheDocument();
    expect(screen.queryByText(/never ran/i)).not.toBeInTheDocument();
  });

  it('notes truncation only when the fetch actually truncated', () => {
    const { unmount } = render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);
    expect(screen.queryByText(/truncated/)).not.toBeInTheDocument();
    unmount();

    mockStreams.runtime = loaded([line(3, 'x')], { reason: 'truncated' });
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);
    expect(screen.getByText(/log truncated to the 2,000-line limit/)).toBeInTheDocument();
  });

  it('Refresh refetches both streams', () => {
    render(<DeploymentLogsModal app={buildApp()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(mockStreams.build.refetch).toHaveBeenCalled();
    expect(mockStreams.runtime.refetch).toHaveBeenCalled();
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
